/**
 * End-to-end HTTP smoke test: spawn server.js, exercise analyze → submit → PDF → booking.
 * Run: node scripts/smoke-ai-flow.js
 */

'use strict';

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const PORT = 8766;
const BASE = `http://127.0.0.1:${PORT}`;
const TMP = path.join(ROOT, '.tmp-smoke-ai-flow');

function envFromDotEnv() {
  const out = {};
  const text = fs.readFileSync(path.join(ROOT, '.env'), 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq > 0) out[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
  }
  return out;
}

async function waitForHealth(timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${BASE}/api/checkup/health`);
      if (res.ok) return res.json();
    } catch (_) { /* not ready */ }
    await new Promise(r => setTimeout(r, 300));
  }
  throw new Error('server did not become healthy');
}

async function main() {
  fs.mkdirSync(path.join(TMP, 'reports'), { recursive: true });
  const dotEnv = envFromDotEnv();
  const env = {
    ...process.env,
    ...dotEnv,
    PORT: String(PORT),
    AI_MOCK_MODE: 'true',
    STORAGE_ENABLED: 'true',
    STORAGE_DRIVER: 'local',
    PDF_OUTPUT_DIR: path.join(TMP, 'reports')
  };
  const child = spawn(process.execPath, ['server.js', String(PORT)], {
    cwd: ROOT, env, stdio: ['ignore', 'pipe', 'pipe']
  });
  child.stderr.on('data', d => process.stderr.write(`[server] ${d}`));

  try {
    const health = await waitForHealth();
    console.log('1. health:', health.status, health.ai_mode, health.provider);

    const analyzeRes = await fetch(`${BASE}/api/checkup/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_name: 'Smoke Traders', contact_name: 'Rajesh', contact_email: 'rajesh@example.com',
        contact_phone: '9826012345', industry: 'Trading & Distribution', turnover_band: '1Cr - 5Cr',
        streamlined: true, dpdp_consent: true
      })
    });
    const report = await analyzeRes.json();
    const reportId = report.meta && report.meta.report_id;
    console.log('2. analyze:', analyzeRes.status, reportId, report.scores && report.scores.overall_score);
    if (!reportId) throw new Error('no report id');

    const submitRes = await fetch(`${BASE}/api/checkup/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reportId,
        submission: { company_name: 'Smoke Traders', contact_email: 'rajesh@example.com' },
        report
      })
    });
    const submit = await submitRes.json();
    console.log('3. submit:', submitRes.status, 'pdfAvailable=' + submit.pdfAvailable, 'pdfPending=' + submit.pdfPending);
    if (submit.pdfAvailable !== false) throw new Error('PDF must NOT exist before booking');

    const bookingRes = await fetch(`${BASE}/api/checkup/booking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId, source: 'smoke', uid: 'SMOKE-1', start_time: '2026-11-25T10:30:00Z' })
    });
    const booking = await bookingRes.json();
    console.log('4. booking:', bookingRes.status, 'pdfAvailable=' + booking.pdfAvailable, booking.pdfUrl);
    if (!booking.pdfUrl) throw new Error('PDF must be released on booking');

    const pdfRes = await fetch(`${BASE}${booking.pdfUrl}`);
    const pdfBuf = Buffer.from(await pdfRes.arrayBuffer());
    const saved = path.join(TMP, 'report.pdf');
    fs.writeFileSync(saved, pdfBuf);
    console.log('5. pdf download:', pdfRes.status, pdfBuf.length, 'bytes, header=' + pdfBuf.slice(0, 5).toString());
    if (pdfBuf.slice(0, 5).toString() !== '%PDF-') throw new Error('bad PDF');
    const recordRes = await fetch(`${BASE}/api/checkup/report/${reportId}`, {
      headers: { 'x-admin-token': process.env.ADMIN_TOKEN || dotEnv.ADMIN_TOKEN || '' }
    });
    const record = await recordRes.json();
    console.log('6. stored record:', recordRes.status, 'status=' + record.status,
      'pdf.stored=' + (record.pdf && record.pdf.stored), 'booking=' + JSON.stringify(record.booking));
    if (!record.pdf || !record.pdf.stored) throw new Error('record missing PDF after booking');
    console.log('\nSMOKE TEST PASSED. PDF saved at:', saved);
  } finally {
    child.kill('SIGTERM');
  }
}

main().catch(err => { console.error('SMOKE TEST FAILED:', err.message); process.exitCode = 1; });
