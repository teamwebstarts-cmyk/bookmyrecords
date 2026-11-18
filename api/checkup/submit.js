/**
 * BookMyRecords — persist a completed assessment, generate its PDF,
 * and alert the owner. Idempotent on report_id.
 */

'use strict';

const storage = require('./storage');
const { pdfFilename } = require('./pdf');
const { notifyOwner } = require('./notify');
const analyze = require('./analyze');

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

async function readJson(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  return JSON.parse(raw);
}

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed', message: 'Use POST.' });
    return;
  }

  try {
    const body = await readJson(req);
    const reportId = String(body.reportId || body.report_id || '').trim();
    const report = body.report;
    if (!reportId || !/^BMR-[A-Za-z0-9_-]+$/.test(reportId)) {
      res.status(400).json({ error: 'Validation Error', message: 'A valid reportId is required.' });
      return;
    }
    if (!report || typeof report !== 'object' || !report.scores || !report.meta) {
      res.status(400).json({ error: 'Validation Error', message: 'A complete report object is required.' });
      return;
    }

    const existing = await storage.getRecord(reportId);
    if (existing) {
      const url = existing.pdf && existing.pdf.stored ? (existing.pdf.url || await storage.getPdfUrl(reportId)) : null;
      res.status(200).json({
        ok: true,
        report_id: reportId,
        pdfUrl: url,
        pdfAvailable: !!url,
        pdfPending: !url,
        duplicate: true
      });
      return;
    }

    const submission = analyze.sanitizeObjectPii(body.submission || {});
    const record = {
      report_id: reportId,
      created_at: new Date().toISOString(),
      status: 'report_ready',
      submission,
      document: body.document || null,
      report,
      scores: {
        overall_score: report.scores.overall_score,
        risk_band: report.scores.risk_band
      },
      engine: (report._meta && report._meta.engine) || 'unknown',
      pdf: { stored: false, filename: pdfFilename(reportId) },
      booking: null,
      notifications: {}
    };

    // PDF is intentionally NOT generated here. It is released only after the consultation booking.
    try {
      await storage.saveRecord(record);
    } catch (err) {
      console.error('[submit] record storage failed (fail-open):', err.message);
    }

    try {
      record.notifications = await notifyOwner('submission', {
        report_id: reportId,
        company_name: report.meta.company_name,
        risk_band: report.scores.risk_band
      });
    } catch (err) {
      console.error('[submit] notification failed (fail-open):', err.message);
    }

    res.status(200).json({
      ok: true,
      report_id: reportId,
      pdfUrl: null,
      pdfAvailable: false,
      pdfPending: true,
      storageEnabled: storage.isEnabled()
    });
  } catch (err) {
    console.error('[submit] handler error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
};
