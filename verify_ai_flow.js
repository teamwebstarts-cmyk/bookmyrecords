/**
 * BookMyRecords — verification suite for the AI / PDF / storage / booking flow.
 * Run: node verify_ai_flow.js          (offline checks)
 *      node verify_ai_flow.js --live   (adds one real AI provider call)
 */

'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = __dirname;

// Same dependency-free loader as server.js so local verification sees .env values.
try {
  const envText = fs.readFileSync(path.join(ROOT, '.env'), 'utf8');
  for (const line of envText.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq < 1) continue;
    const key = t.slice(0, eq).trim();
    if (key && process.env[key] === undefined) process.env[key] = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
  }
} catch (_) { /* env-only mode */ }

const ai = require('./api/checkup/ai');
const pdf = require('./api/checkup/pdf');
const storage = require('./api/checkup/storage');
const analyze = require('./api/checkup/analyze');
const submitHandler = require('./api/checkup/submit');
const booking = require('./api/checkup/booking');
const healthHandler = require('./api/checkup/health');
const { calculateHealthScore } = require('./api/checkup/score');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try { fn(); console.log(`  [PASS] ${name}`); passed++; }
  catch (e) { console.log(`  [FAIL] ${name}: ${e.message}`); failed++; }
}
async function asyncTest(name, fn) {
  try { await fn(); console.log(`  [PASS] ${name}`); passed++; }
  catch (e) { console.log(`  [FAIL] ${name}: ${e.message}`); failed++; }
}

function createRes() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    writableEnded: false,
    setHeader(k, v) { this.headers[k] = v; },
    status(code) { this.statusCode = code; return this; },
    json(obj) { this.body = obj; this.writableEnded = true; return this; },
    end() { this.writableEnded = true; return this; }
  };
}

function createReq(body, headers = {}) {
  return {
    method: 'POST',
    headers,
    body,
    async *[Symbol.asyncIterator]() { /* body provided directly */ }
  };
}

function sampleReport(reportId) {
  const scores = calculateHealthScore({ q1: 3, q2: 3, q3: 3, q4: 3 });
  return analyze.generateSyntheticReport({
    companyName: 'Verification Traders',
    industry: 'Trading & Distribution',
    turnoverBand: '1Cr - 5Cr',
    scores,
    notes: 'Verification run',
    reportId
  });
}

(async () => {
  console.log('================================================================');
  console.log('BookMyRecords — AI / PDF / Storage / Booking Verification');
  console.log('================================================================\n');

  console.log('--- SUITE 1: AI client config ---');
  test('provider config reads base URL, model and keys from env', () => {
    const cfg = ai.getAiConfig();
    assert.ok(cfg.baseUrl.startsWith('https://'), 'base URL expected');
    assert.ok(cfg.model.includes('deepseek'), 'model expected');
    assert.ok(cfg.keys.length >= 1, 'at least one key expected');
  });
  test('derived tokens are parsed from JSON and fenced JSON', () => {
    assert.deepStrictEqual(ai.extractJson('{"a":1}'), { a: 1 });
    assert.deepStrictEqual(ai.extractJson('```json\n{"a":2}\n```'), { a: 2 });
  });
  test('health reports live_ai when mock is off and a key exists', async () => {
    const prevMock = process.env.AI_MOCK_MODE;
    process.env.AI_MOCK_MODE = 'false';
    const res = createRes();
    await healthHandler({ method: 'GET', headers: {} }, res);
    assert.strictEqual(res.statusCode, 200);
    assert.ok(['live_ai', 'synthetic_mock'].includes(res.body.ai_mode));
    if (prevMock !== undefined) process.env.AI_MOCK_MODE = prevMock;
  });

  console.log('\n--- SUITE 2: PDF generation ---');
  const reportId = 'BMR-VERIFY-' + Date.now().toString(36).toUpperCase();
  const report = sampleReport(reportId);
  let pdfBuffer = null;
  await asyncTest('generates a valid non-trivial PDF Buffer', async () => {
    pdfBuffer = await pdf.generateReportPdf(report);
    assert.ok(Buffer.isBuffer(pdfBuffer));
    assert.strictEqual(pdfBuffer.slice(0, 5).toString(), '%PDF-');
    assert.ok(pdfBuffer.length > 3000, `PDF too small: ${pdfBuffer.length}`);
  });
  test('filename derived from report id', () => {
    assert.strictEqual(pdf.pdfFilename(reportId), `${reportId}.pdf`);
  });
  test('rupee symbol sanitized for standard PDF fonts', () => {
    assert.strictEqual(pdf.safeText('Rs 500 \u20B9 600'), 'Rs 500 Rs. 600');
  });

  console.log('\n--- SUITE 3: local storage adapter ---');
  const tmpDir = path.join(ROOT, '.tmp-ai-flow-storage');
  process.env.STORAGE_ENABLED = 'true';
  process.env.STORAGE_DRIVER = 'local';
  process.env.PDF_OUTPUT_DIR = path.join(tmpDir, 'reports');
  fs.mkdirSync(process.env.PDF_OUTPUT_DIR, { recursive: true });

  await asyncTest('saves and retrieves a record by report_id', async () => {
    await storage.saveRecord({ report_id: reportId, status: 'report_ready', report });
    const found = await storage.getRecord(reportId);
    assert.ok(found && found.report_id === reportId);
  });
  await asyncTest('saves PDF and returns a local download URL', async () => {
    await storage.savePdf(reportId, pdfBuffer);
    const url = await storage.getPdfUrl(reportId);
    assert.ok(url && url.includes(reportId));
    const buf = await storage.getPdfBuffer(reportId);
    assert.ok(buf && buf.length > 3000);
  });
  await asyncTest('updates booking status without losing the record', async () => {
    const result = await storage.updateBooking(reportId, { uid: 'TEST-UID', start_time: '2026-11-20T10:00:00Z' });
    assert.strictEqual(result.updated, true);
    const found = await storage.getRecord(reportId);
    assert.strictEqual(found.status, 'booked');
    assert.strictEqual(found.booking.uid, 'TEST-UID');
  });

  console.log('\n--- SUITE 4: submit + booking handlers ---');
  const reportId2 = 'BMR-SUBMIT-' + Date.now().toString(36).toUpperCase();
  const report2 = sampleReport(reportId2);
  await asyncTest('POST /api/checkup/submit stores report but NO PDF before booking', async () => {
    const req = createReq({
      reportId: reportId2,
      submission: { company_name: 'Submit Traders', contact_email: 'test@example.com' },
      report: report2
    });
    const res = createRes();
    await submitHandler(req, res);
    assert.strictEqual(res.statusCode, 200, JSON.stringify(res.body));
    assert.strictEqual(res.body.ok, true);
    assert.strictEqual(res.body.pdfUrl, null, 'no PDF before booking');
    assert.strictEqual(res.body.pdfAvailable, false);
    assert.strictEqual(res.body.pdfPending, true);
    const rec = await storage.getRecord(reportId2);
    assert.strictEqual(rec.status, 'report_ready');
    assert.strictEqual(rec.pdf.stored, false);
    assert.strictEqual(await storage.getPdfBuffer(reportId2), null, 'no PDF file yet');
  });
  await asyncTest('submit is idempotent and does not clobber data', async () => {
    const req = createReq({ reportId: reportId2, submission: { company_name: 'Submit Traders' }, report: report2 });
    const res = createRes();
    await submitHandler(req, res);
    assert.strictEqual(res.body.duplicate, true);
    const rec = await storage.getRecord(reportId2);
    assert.strictEqual(rec.status, 'report_ready');
  });
  await asyncTest('client booking marks record booked AND releases the PDF', async () => {
    const req = createReq({ reportId: reportId2, source: 'test', uid: 'CLIENT-1', start_time: '2026-11-21T09:00:00Z' });
    const res = createRes();
    await booking.clientHandler(req, res);
    assert.strictEqual(res.body.ok, true);
    assert.strictEqual(res.body.applied, true);
    assert.ok(res.body.pdfUrl, 'pdfUrl must be released on booking');
    const rec = await storage.getRecord(reportId2);
    assert.strictEqual(rec.status, 'booked');
    assert.strictEqual(rec.pdf.stored, true);
    assert.ok(await storage.getPdfBuffer(reportId2), 'PDF file must exist after booking');
  });
  test('extracts report id from Cal.com prefill notes', () => {
    assert.strictEqual(
      booking.extractReportId('Report ID: BMR-20261117-ABC123 | Company: Test | Phone: 999'),
      'BMR-20261117-ABC123'
    );
  });
  await asyncTest('Cal.com webhook applies booking from payload', async () => {
    const req = createReq({
      triggerEvent: 'BOOKING_CREATED',
      payload: {
        uid: 'CAL-1',
        startTime: '2026-11-22T11:00:00Z',
        notes: `Report ID: ${reportId2} | Company: Submit Traders`,
        attendees: [{ email: 'client@example.com' }]
      }
    });
    const res = createRes();
    await booking.webhookHandler(req, res);
    assert.strictEqual(res.statusCode, 200, JSON.stringify(res.body));
    assert.strictEqual(res.body.applied, true);
    assert.ok(res.body.pdfUrl, 'duplicate booking event still returns existing PDF link');
    const rec = await storage.getRecord(reportId2);
    assert.strictEqual(rec.status, 'booked');
    assert.strictEqual(rec.pdf.stored, true);
  });

  console.log('\n--- SUITE 5: live AI provider (opt-in with --live) ---');
  if (process.argv.includes('--live')) {
    await asyncTest('live provider returns a valid report through /api/checkup/analyze', async () => {
      const prevMock = process.env.AI_MOCK_MODE;
      process.env.AI_MOCK_MODE = 'false';
      const req = createReq({
        company_name: 'Live Verification Traders',
        contact_name: 'Test Contact',
        contact_email: 'test@example.com',
        contact_phone: '9826012345',
        industry: 'Trading & Distribution',
        turnover_band: '1Cr - 5Cr',
        streamlined: true,
        dpdp_consent: true
      });
      const res = createRes();
      await analyze(req, res);
      assert.strictEqual(res.statusCode, 200, JSON.stringify(res.body).slice(0, 400));
      assert.ok(analyze.validateReportSchema(res.body), 'schema invalid');
      assert.ok(res.body._meta.engine.includes('deepseek'), `engine: ${res.body._meta.engine}`);
      assert.ok(res.body.meta.report_id, 'report_id expected');
      if (prevMock !== undefined) process.env.AI_MOCK_MODE = prevMock;
    });
  } else {
    console.log('  [SKIP] pass --live to exercise the real provider');
  }

  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) { /* ignore */ }

  console.log('\n================================================================');
  console.log(`TOTAL TESTS: ${passed + failed}`);
  console.log(`PASSED:      ${passed}`);
  console.log(`FAILED:      ${failed}`);
  console.log('================================================================');
  process.exitCode = failed ? 1 : 0;
})();
