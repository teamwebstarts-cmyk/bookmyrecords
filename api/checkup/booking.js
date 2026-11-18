/**
 * BookMyRecords — booking capture.
 *  - POST /api/checkup/booking          : client-side fallback event
 *  - POST /api/checkup/booking-webhook  : Cal.com BOOKING_CREATED webhook (authoritative)
 * Both update the stored submission and alert the owner using report_id as join key.
 */

'use strict';

const crypto = require('crypto');
const storage = require('./storage');
const { notifyOwner } = require('./notify');
const { generateReportPdf, pdfFilename } = require('./pdf');

// Guards against webhook + client fallback both generating the PDF at once.
const pdfInFlight = new Set();

function setCors(res, methods) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', methods + ', OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Cal-Signature');
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return { parsed: req.body, raw: JSON.stringify(req.body) };
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  return { parsed: raw ? JSON.parse(raw) : {}, raw };
}

function extractReportId(text) {
  const match = String(text || '').match(/Report ID:\s*([A-Za-z0-9_-]+)/i);
  return match ? match[1] : null;
}

function verifySignature(raw, header) {
  const secret = process.env.CAL_WEBHOOK_SECRET || '';
  if (!secret || /^(replace|your-|optional)$/i.test(secret)) return { verified: false, reason: 'not_configured' };
  if (!header) return { verified: false, reason: 'missing_signature' };
  const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex');
  const provided = String(header).replace(/^sha256=/, '');
  try {
    const ok = crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(provided, 'hex'));
    return { verified: ok, reason: ok ? 'ok' : 'mismatch' };
  } catch (_) {
    return { verified: false, reason: 'invalid_signature' };
  }
}

async function applyBooking({ reportId, booking, source }) {
  if (!reportId) return { applied: false, reason: 'report_id_not_found' };
  const update = await storage.updateBooking(reportId, { ...booking, source });
  if (!update.updated) return { applied: false, reason: update.reason || 'storage_disabled' };

  let record = await storage.getRecord(reportId);
  let pdfUrl = null;
  let pdfError = null;

  // PDF is released ONLY here, after a booking has been recorded.
  if (pdfInFlight.has(reportId)) {
    pdfUrl = record && record.pdf && record.pdf.stored ? (record.pdf.url || await storage.getPdfUrl(reportId)) : null;
  } else {
    pdfInFlight.add(reportId);
    try {
      if (record && record.pdf && record.pdf.stored) {
        pdfUrl = record.pdf.url || await storage.getPdfUrl(reportId);
      } else if (storage.isEnabled() && record && record.report) {
        const buffer = await generateReportPdf(record.report);
        await storage.savePdf(reportId, buffer);
        pdfUrl = await storage.getPdfUrl(reportId);
        await storage.markPdfStored(reportId, {
          stored: true,
          filename: pdfFilename(reportId),
          url: pdfUrl,
          generated_at: new Date().toISOString()
        });
        record = await storage.getRecord(reportId);
      }
    } catch (err) {
      pdfError = err.message;
      console.error('[booking] PDF generation failed (fail-open):', err.message);
    } finally {
      pdfInFlight.delete(reportId);
    }
  }

  if (!update.already_booked) {
    await notifyOwner('booking', {
      report_id: reportId,
      company_name: record && record.submission ? record.submission.company_name : '',
      risk_band: record && record.scores ? record.scores.risk_band : '',
      start_time: booking.start_time || booking.startTime || '',
      pdfUrl
    });
  }

  return { applied: true, report_id: reportId, pdfUrl, pdfAvailable: !!pdfUrl, pdfError, update };
}

async function clientHandler(req, res) {
  setCors(res, 'POST');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method Not Allowed' }); return; }
  try {
    const { parsed } = await readBody(req);
    const reportId = String(parsed.reportId || parsed.report_id || '').trim();
    const source = parsed.source || 'client';
    const booking = {
      uid: parsed.uid || null,
      start_time: parsed.start_time || parsed.startTime || null,
      email: parsed.email || null
    };
    const result = await applyBooking({ reportId, booking, source });
    res.status(200).json({ ok: true, ...result });
  } catch (err) {
    console.error('[booking] handler error:', err.message);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
}

async function webhookHandler(req, res) {
  setCors(res, 'POST');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method Not Allowed' }); return; }
  try {
    const { parsed, raw } = await readBody(req);
    const check = verifySignature(raw, req.headers['x-cal-signature'] || req.headers['x-webhook-signature']);
    if (check.verified === false && check.reason === 'mismatch') {
      res.status(401).json({ error: 'Invalid webhook signature' });
      return;
    }

    const event = parsed.triggerEvent || parsed.event || '';
    const p = parsed.payload || parsed.booking || parsed;
    const notes = p.notes || (p.metadata && p.metadata.notes) || p.description || '';
    const reportId = extractReportId(notes) || extractReportId(JSON.stringify(parsed));
    const booking = {
      uid: p.uid || p.booking_uid || null,
      start_time: p.startTime || p.start_time || null,
      attendee_email: p.attendees && p.attendees[0] ? p.attendees[0].email : null,
      event: event
    };
    const result = await applyBooking({ reportId, booking, source: `cal.com:${check.reason}` });
    res.status(200).json({ ok: true, event, signature: check.reason, ...result });
  } catch (err) {
    console.error('[booking-webhook] handler error:', err.message);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
}

module.exports = { clientHandler, webhookHandler, applyBooking, extractReportId, verifySignature };
