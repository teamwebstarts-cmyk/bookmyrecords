/**
 * BookMyRecords — owner notification (Resend email + optional Telegram bot).
 * Never attaches the PDF or raw notes; only IDs, band and safe summary fields.
 */

'use strict';

function clean(v) {
  return typeof v === 'string' && v.trim() && !/^(replace|your-|optional)$/i.test(v.trim()) ? v.trim() : '';
}

async function sendResendEmail(subject, text) {
  const key = clean(process.env.RESEND_API_KEY);
  const to = clean(process.env.OWNER_EMAIL);
  if (!key || !to) return { skipped: true, reason: 'resend_not_configured' };

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'BookMyRecords Alerts <onboarding@resend.dev>',
      to: [to],
      subject,
      text
    })
  });
  if (!res.ok) throw new Error(`Resend failed: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
  return { sent: true, channel: 'resend' };
}

async function sendTelegram(text) {
  const token = clean(process.env.TELEGRAM_BOT_TOKEN);
  const chat = clean(process.env.TELEGRAM_CHAT_ID);
  if (!token || !chat) return { skipped: true, reason: 'telegram_not_configured' };

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chat, text, parse_mode: 'HTML' })
  });
  if (!res.ok) throw new Error(`Telegram failed: HTTP ${res.status}`);
  return { sent: true, channel: 'telegram' };
}

async function notifyOwner(event, payload = {}) {
  const reportId = payload.report_id || payload.reportId || 'unknown';
  const company = payload.company_name || 'Unknown company';
  const band = payload.risk_band || 'n/a';
  const isBooking = event === 'booking';
  const subject = isBooking
    ? `[BMR] Consultation booked — ${reportId}`
    : `[BMR] New health assessment — ${reportId}`;
  const pdfLine = isBooking && payload.pdfUrl ? `\nFull report PDF: ${payload.pdfUrl}` : '';
  const text = isBooking
    ? `New consultation booking.\nReport ID: ${reportId}\nCompany: ${company}\nScore band: ${band}\nSlot: ${payload.start_time || 'see Cal.com'}\nCall: +91 96696 93315${pdfLine}`
    : `New business health assessment submitted.\nReport ID: ${reportId}\nCompany: ${company}\nScore band: ${band}\nReview the record in the storage dashboard. The full PDF is released after the consultation is booked.`;

  const results = { event, report_id: reportId };
  try {
    results.email = await sendResendEmail(subject, text);
  } catch (err) {
    results.email = { sent: false, error: err.message };
  }
  try {
    results.telegram = await sendTelegram(
      `<b>BMR ${isBooking ? 'booking' : 'new assessment'}</b>\n${reportId}\n${company}\nBand: ${band}`
    );
  } catch (err) {
    results.telegram = { sent: false, error: err.message };
  }
  return results;
}

module.exports = { notifyOwner, sendResendEmail, sendTelegram };
