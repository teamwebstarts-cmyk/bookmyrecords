/**
 * Generates HANDOVER_REPORT.pdf from a structured English summary.
 * Reuses pdf-lib (already a project dependency). No new dependency.
 * Run: node scripts/generate-handover-pdf.js
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

const OUT = path.resolve(__dirname, '..', 'HANDOVER_REPORT.pdf');

const SECTIONS = [
  {
    title: '1. Executive Summary',
    body: [
      'Status: DONE_WITH_CONCERNS. Full flow implemented and rechecked.',
      'User journey: checkup form -> AI report (DeepSeek-compatible, live) -> report data stored (NO PDF yet) -> Cal.com consultation booking -> PDF generated + stored + link revealed -> owner alerted with secure PDF link.',
      'All tests pass: M2 0 errors, M3 29/29, M4 26/26, E2E 70/70, AI flow 14/14 offline + 15/15 live, HTTP smoke 6/6, all JS syntax OK, assets 0 missing, 0 secret leaks in tracked text.'
    ]
  },
  {
    title: '2. What Was Implemented',
    body: [
      '1. .env + .env.example + .gitignore: owner key lives only in ignored .env; placeholders in example.',
      '2. Owner hms- key verified live (models 200, chat 200). Two earlier invalid tokens removed.',
      '3. api/checkup/ai.js: provider-agnostic OpenAI-compatible client, two-key fallback, 120s timeout.',
      '4. analyze.js: Gemini replaced with live AI call; one canonical report_id; deterministic scores unchanged; synthetic fail-open fallback.',
      '5. health.js: live_ai / model reporting.',
      '6. pdf.js: pdf-lib full-report PDF, rupee sanitized to Rs., text wrapping, page numbers.',
      '7. storage.js: local filesystem + Supabase adapters, markPdfStored() atomic claim.',
      '8. submit.js: stores report data only, NO PDF before booking, returns pdfPending=true.',
      '9. booking.js: Cal.com webhook + client fallback, lazy PDF on booking, double-event guards.',
      '10. notify.js: Resend + Telegram; submission mail says PDF comes after booking, booking mail includes PDF link.',
      '11. server.js: .env loader, six new endpoints, admin token for full record, path-traversal fix.',
      '12. checkup.js / checkup.html / bmr-ds.css: PDF link hidden until booking, polling fallback, Cal.com postMessage handling, corrected consent copy.',
      '13. verify_ai_flow.js and scripts/smoke-ai-flow.js added; README and decision docs updated.'
    ]
  },
  {
    title: '3. Recheck: Bugs Found and Fixed',
    body: [
      'Full record endpoint exposed contact PII with CORS *. Fixed: x-admin-token required; separate /status endpoint returns only status and pdfUrl.',
      'Static path traversal prefix check was weak. Fixed with PUBLIC_DIR + path.sep boundary.',
      'PDF was generated at submit time. Moved to booking time per owner requirement.',
      'Webhook and client fallback could generate the PDF/email twice. Fixed with pdfInFlight Set, markPdfStored(), and already_booked dedupe.',
      'npm init copied old template text into package.json. Replaced with correct BMR metadata and scripts.',
      'Full AI report took ~63s; 60s timeout aborted it. Raised to 120s with synthetic fail-open.'
    ]
  },
  {
    title: '4. Full Flow',
    body: [
      'USER: 1) Fill checkup form with DPDP consent. 2) POST /api/checkup/analyze returns live AI report. 3) Gated report shown; PDF link stays hidden. 4) POST /api/checkup/submit stores report data, returns pdfPending=true. 5) Click "Book the 30-minute review call"; Cal.com embed is prefilled with name, email, phone and Report ID in notes. 6) Booking event triggers PDF generation, storage and link reveal via postMessage response or 3-second status polling.',
      'OWNER: 1) Resend/Telegram alert with report ID, company, score band, slot and secure PDF link. 2) Full record available at GET /api/checkup/report/:id with admin token. 3) PDF download at /api/checkup/report/:id/pdf. An admin UI is optional and not needed yet.'
    ]
  },
  {
    title: '5. Recommendations',
    body: [
      'HOSTING: Render free is demo-only (15-minute sleep, ~1-minute wake, ephemeral files, free Postgres expires in 30 days, SMTP ports blocked). For real leads use a small VPS (~$4-5/month). Everything stays on one always-on disk.',
      'DATABASE: On VPS use SQLite plus a PDF folder: no pause, no expiry, one place. If hosted-free is required, use MongoDB Atlas M0 (512 MB, pauses after 30 days idle, resumable). Supabase already has an adapter but pauses after one week idle.',
      'EMAIL: Keep Resend free (3,000/month, 100/day, no approval) plus Telegram fallback. Do not use SMTP from Render because ports are blocked. Never attach the PDF to email; send a secure link only.',
      'BOOKING: Keep Cal.com free and add a BOOKING_CREATED webhook. Calendly free allows only one event type; Cal.diy is recommended by its own vendor for non-production use; a custom form would require building calendar sync and reminders ourselves.',
      'STORAGE: Do not use Excel or email-only. A structured record plus a PDF file gives query, audit, idempotency and a DPDP deletion path.'
    ]
  },
  {
    title: '6. Fixed vs Not Fixed',
    body: [
      'FIXED: AI provider swap, live key, report_id join, PDF-on-booking, PII exposure, path traversal, idempotency, consent copy, tests, secret hygiene, package metadata, AI timeout.',
      'NOT FIXED (external setup or separate scope): Supabase credentials not supplied, so production data is on local filesystem; Resend/Telegram keys not supplied, so owner alerts are skipped; Cal.com webhook not registered in dashboard; no git commit; browser screenshot skipped because gstack browse needs a one-time build; non-AI gaps (services index, contact form backend, fabricated proof content, template residue) are separate tasks.'
    ]
  },
  {
    title: '7. Doubts and Risks',
    body: [
      'The gateway 100milionseek.top is a third-party free processor, not official DeepSeek (hosted in Canada, no SLA, had an outage on 15 Nov 2026). Sign-off is needed before sending financial/PII data. Switching to official api.deepseek.com is an env-only change.',
      'Full report latency is about 60-65 seconds. Processing animation is shown; timeout is 120 seconds with synthetic fail-open.',
      'When the API fails, the user receives a synthetic report; the UI does not currently distinguish real from synthetic. This is a possible next improvement.',
      'Free tiers can change. A VPS keeps your data on your own disk.',
      'Team and testimonial proof content remains unverified; that cleanup is a separate task.'
    ]
  },
  {
    title: '8. What Is Needed From You',
    body: [
      '1) Choose the stack: A = VPS (recommended), B = MongoDB Atlas M0, C = Render free demo, D = Supabase (already built).',
      '2) Supply Resend key + verified domain + OWNER_EMAIL (or Telegram bot token and chat ID) so alerts really arrive.',
      '3) Register Cal.com webhook: https://<your-host>/api/checkup/booking-webhook, trigger Booking Created, secret CAL_WEBHOOK_SECRET.',
      '4) Give permission to commit. Currently all changes are in the working tree only.'
    ]
  },
  {
    title: '9. Test Evidence',
    body: [
      'node --check on all JS files: OK',
      'verify_m2.js: 0 errors; verify_m3.js: 29/29; verify_m4.js: 26/26; verify_e2e.js: 70/70',
      'verify_ai_flow.js: 14/14 offline; with --live: 15/15 including a real provider call',
      'smoke-ai-flow.js: submit pdfPending=true, booking pdfAvailable=true, PDF 7,756 bytes with %PDF- header, record status=booked and pdf.stored=true',
      'audit-assets.py: 0 missing; secret scan: 0 key hits in tracked text'
    ]
  },
  {
    title: '10. Key Files',
    body: [
      'api/checkup/: ai.js, analyze.js, health.js, pdf.js, storage.js, submit.js, booking.js, notify.js',
      'server.js, assets/js/checkup.js, checkup.html, assets/css/bmr-ds.css',
      '.env (ignored), .env.example, .gitignore, package.json',
      'verify_ai_flow.js, scripts/smoke-ai-flow.js, scripts/generate-handover-pdf.js',
      'Docs: STACK_DECISION_REPORT.md, AI_DEEPSEEK_PDF_STORAGE_BOOKING_PLAN.md, PROJECT_DEEP_RESEARCH_REPORT.md, TEMPLATE_REMOVAL_REPORT.md, HANDOVER_REPORT.md'
    ]
  }
];

function safe(s) {
  return String(s).replace(/\u20B9/g, 'Rs.').replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ').replace(/\s+/g, ' ').trim();
}

async function main() {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  let page = doc.addPage([595, 842]);
  let y = 800;
  const left = 48;
  const width = 499;
  const BLUE = rgb(0.043, 0.365, 0.839);
  const INK = rgb(0.12, 0.16, 0.27);
  const GREY = rgb(0.42, 0.46, 0.52);

  function newPage() { page = doc.addPage([595, 842]); y = 800; }
  function wrap(text, font, size, max) {
    const words = safe(text).split(' ');
    const lines = [];
    let line = '';
    for (const word of words) {
      const c = line ? line + ' ' + word : word;
      if (font.widthOfTextAtSize(c, size) <= max || !line) line = c;
      else { lines.push(line); line = word; }
    }
    if (line) lines.push(line);
    return lines;
  }
  function ensure(space) { if (y - space < 56) newPage(); }
  function para(text, size, font, color, indent) {
    for (const line of wrap(text, font, size, width - (indent || 0))) {
      ensure(size + 5);
      page.drawText(line, { x: left + (indent || 0), y, size, font, color });
      y -= size + 5;
    }
    y -= 4;
  }

  page.drawRectangle({ x: 0, y: 760, width: 595, height: 82, color: BLUE });
  page.drawText('BOOK MY RECORDS', { x: left, y: 808, size: 18, font: bold, color: rgb(1, 1, 1) });
  page.drawText('AI / PDF / Booking Flow - Final Handover & Review', { x: left, y: 784, size: 11, font: regular, color: rgb(1, 1, 1) });
  page.drawText('17 Nov 2026', { x: 430, y: 808, size: 9, font: regular, color: rgb(1, 1, 1) });
  y = 745;

  for (const section of SECTIONS) {
    ensure(30);
    page.drawText(section.title, { x: left, y, size: 13, font: bold, color: BLUE });
    y -= 20;
    page.drawRectangle({ x: left, y, width, height: 1, color: rgb(1, 0.784, 0.31) });
    y -= 14;
    for (const line of section.body) para(line, 9.5, regular, INK);
    y -= 8;
  }

  const count = doc.getPageCount();
  for (let i = 0; i < count; i++) {
    doc.getPage(i).drawText(`BookMyRecords | Handover | Page ${i + 1} of ${count}`, {
      x: left, y: 30, size: 7.5, font: regular, color: GREY
    });
  }

  const bytes = await doc.save();
  fs.writeFileSync(OUT, Buffer.from(bytes));
  console.log(`PDF written: ${OUT} (${bytes.length} bytes, ${count} pages)`);
}

main().catch(err => { console.error(err); process.exitCode = 1; });
