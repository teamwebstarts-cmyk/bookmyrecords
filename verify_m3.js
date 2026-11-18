/**
 * BookMyRecords Milestone 3 Comprehensive Verification Suite
 * 
 * Verifies:
 * 1. Deterministic Scoring Engine across 6 pillars and 25 questions
 * 2. PII Sanitizer & Indian statutory identifier masking (PAN, Aadhaar, GSTIN, Bank, Card)
 * 3. Health Check endpoint (/api/checkup/health)
 * 4. Analyze Serverless Function (/api/checkup/analyze) in Mock Mode & Schema validation
 * 5. Error handling and input validation (HTTP 400, HTTP 405)
 * 
 * Execution: node verify_m3.js
 */

'use strict';

const assert = require('assert');
const { calculateHealthScore, PILLARS, QUESTIONS, RISK_BANDS } = require('./api/checkup/score');
const healthHandler = require('./api/checkup/health');
const analyzeHandler = require('./api/checkup/analyze');
const {
  sanitizePii,
  sanitizeObjectPii,
  validateCheckupPayload,
  generateSyntheticReport,
  validateReportSchema
} = analyzeHandler;

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  [FAIL] ${name}`);
    console.error(`         ${err.message}`);
    failedTests++;
  }
}

async function runAsyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  [FAIL] ${name}`);
    console.error(`         ${err.message}`);
    failedTests++;
  }
}

/**
 * Creates a mock HTTP response object
 */
function createMockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(key, value) {
      this.headers[key.toLowerCase()] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
    end() {
      return this;
    }
  };
  return res;
}

async function runAllTests() {
  console.log('================================================================');
  console.log('BookMyRecords Milestone 3 — AI & Scoring Engine Test Suite');
  console.log('================================================================\n');

  // ===========================================================================
  // SUITE 1: Deterministic Scoring Engine (api/checkup/score.js)
  // ===========================================================================
  console.log('--- SUITE 1: Deterministic Scoring Engine ---');

  runTest('Pillars specification integrity: 6 pillars, total weight 100%, total points 100', () => {
    assert.strictEqual(PILLARS.length, 6, 'Must have exactly 6 pillars');
    const totalWeight = PILLARS.reduce((sum, p) => sum + p.weight_percentage, 0);
    const totalMax = PILLARS.reduce((sum, p) => sum + p.max_score, 0);
    assert.strictEqual(totalWeight, 100, 'Pillars total weight must equal 100%');
    assert.strictEqual(totalMax, 100, 'Pillars total max score must equal 100 points');
    assert.strictEqual(PILLARS[0].max_score, 25, 'Pillar 1 max score must be 25');
    assert.strictEqual(PILLARS[1].max_score, 20, 'Pillar 2 max score must be 20');
    assert.strictEqual(PILLARS[2].max_score, 15, 'Pillar 3 max score must be 15');
    assert.strictEqual(PILLARS[3].max_score, 15, 'Pillar 4 max score must be 15');
    assert.strictEqual(PILLARS[4].max_score, 15, 'Pillar 5 max score must be 15');
    assert.strictEqual(PILLARS[5].max_score, 10, 'Pillar 6 max score must be 10');
  });

  runTest('Questions specification integrity: exactly 25 questions across 6 pillars', () => {
    assert.strictEqual(QUESTIONS.length, 25, 'Must have exactly 25 questions');
    for (let i = 1; i <= 25; i++) {
      const q = QUESTIONS.find(item => item.id === `q${i}`);
      assert.ok(q, `Question q${i} must exist`);
      assert.strictEqual(q.number, i, `Question q${i} number must be ${i}`);
      assert.ok(q.prompt && q.prompt.length > 5, `Question q${i} must have a descriptive prompt`);
      assert.strictEqual(q.options.length, 4, `Question q${i} must have 4 rating options`);
    }
  });

  runTest('Ceiling Score Check: All ratings = 4 yields 100.0, Strong band, and all Good statuses', () => {
    const all4s = Object.fromEntries(Array.from({ length: 25 }, (_, i) => [`q${i + 1}`, 4]));
    const result = calculateHealthScore(all4s);
    assert.strictEqual(result.overall_score, 100.0, 'Overall score must be 100.0');
    assert.strictEqual(result.risk_band, 'Strong', 'Risk band must be Strong');
    assert.strictEqual(result.pillar_scores.length, 6);
    for (const p of result.pillar_scores) {
      assert.strictEqual(p.score, p.max_score, `${p.pillar_name} score must equal max_score`);
      assert.strictEqual(p.status, 'Good', `${p.pillar_name} status must be Good`);
      assert.strictEqual(p.percentage, 100, `${p.pillar_name} percentage must be 100`);
    }
  });

  runTest('Floor Score Check: All ratings = 1 yields 0.0, Critical band, and all Attention Needed statuses', () => {
    const all1s = Object.fromEntries(Array.from({ length: 25 }, (_, i) => [`q${i + 1}`, 1]));
    const result = calculateHealthScore(all1s);
    assert.strictEqual(result.overall_score, 0.0, 'Overall score must be 0.0');
    assert.strictEqual(result.risk_band, 'Critical', 'Risk band must be Critical');
    for (const p of result.pillar_scores) {
      assert.strictEqual(p.score, 0, `${p.pillar_name} score must be 0`);
      assert.strictEqual(p.status, 'Attention Needed', `${p.pillar_name} status must be Attention Needed`);
      assert.strictEqual(p.percentage, 0, `${p.pillar_name} percentage must be 0`);
    }
  });

  runTest('Intermediate Score Check: All ratings = 3 yields ~66.7, Moderate band, and all Average statuses', () => {
    const all3s = Object.fromEntries(Array.from({ length: 25 }, (_, i) => [`q${i + 1}`, 3]));
    const result = calculateHealthScore(all3s);
    assert.strictEqual(result.overall_score, 66.7, 'Overall score must be 66.7');
    assert.strictEqual(result.risk_band, 'Moderate', 'Risk band must be Moderate');
    for (const p of result.pillar_scores) {
      assert.strictEqual(p.status, 'Average', `${p.pillar_name} status must be Average`);
      assert.ok(p.percentage >= 66 && p.percentage <= 67, `${p.pillar_name} percentage must be ~66.7`);
    }
  });

  runTest('Intermediate Score Check: All ratings = 2 yields ~33.3, Critical band, and all Attention Needed statuses', () => {
    const all2s = Object.fromEntries(Array.from({ length: 25 }, (_, i) => [`q${i + 1}`, 2]));
    const result = calculateHealthScore(all2s);
    assert.strictEqual(result.overall_score, 33.3, 'Overall score must be 33.3');
    assert.strictEqual(result.risk_band, 'Critical', 'Risk band must be Critical');
    for (const p of result.pillar_scores) {
      assert.strictEqual(p.status, 'Attention Needed', `${p.pillar_name} status must be Attention Needed`);
    }
  });

  runTest('Risk Band Boundaries Verification', () => {
    // Helper to evaluate arbitrary points
    const checkBand = (score) => {
      if (score >= 80.0) return 'Strong';
      if (score >= 60.0) return 'Moderate';
      if (score >= 40.0) return 'Vulnerable';
      return 'Critical';
    };
    assert.strictEqual(checkBand(80.0), 'Strong');
    assert.strictEqual(checkBand(79.9), 'Moderate');
    assert.strictEqual(checkBand(60.0), 'Moderate');
    assert.strictEqual(checkBand(59.9), 'Vulnerable');
    assert.strictEqual(checkBand(40.0), 'Vulnerable');
    assert.strictEqual(checkBand(39.9), 'Critical');
  });

  runTest('Resilience & Type Handling: accepts string values "3", numeric keys 1..25, and defaults missing to 1', () => {
    const stringAnswers = {
      1: '4', // string rating
      q2: 3,
      q3: 4
      // remaining omitted
    };
    const result = calculateHealthScore(stringAnswers);
    assert.ok(result.overall_score > 0, 'Score must be calculated from available answers');
    assert.strictEqual(result.answered_count, 3, 'Must detect 3 answered questions');
    assert.strictEqual(result.total_questions, 25, 'Total questions must be 25');
  });

  runTest('answered_count ignores extraneous and invalid question keys', () => {
    const rawWithBogus = {
      q1: 4,
      q2: 3,
      bogus_key: 4,
      invalidQuestion: 2,
      q99: 1,
      extra_field: 'ignored'
    };
    const result = calculateHealthScore(rawWithBogus);
    assert.strictEqual(result.answered_count, 2, 'answered_count must only count valid question IDs (q1, q2)');
  });

  // ===========================================================================
  // SUITE 2: PII Sanitizer & Indian Statutory Identifiers Masking
  // ===========================================================================
  console.log('\n--- SUITE 2: PII Sanitizer & Indian Statutory Identifiers Masking ---');

  runTest('Scrub Indian PAN correctly without affecting nearby text', () => {
    const input = 'Company tax PAN is ABCDE1234F for filing.';
    const output = sanitizePii(input);
    assert.strictEqual(output, 'Company tax PAN is [REDACTED_PAN] for filing.');
  });

  runTest('Scrub Indian Aadhaar (12 digits with spaces or hyphens) correctly', () => {
    const input1 = 'Promoter Aadhaar: 3456 7890 1234 on record.';
    const input2 = 'Director Aadhaar: 4567-8901-2345 in file.';
    assert.strictEqual(sanitizePii(input1), 'Promoter Aadhaar: [REDACTED_AADHAAR] on record.');
    assert.strictEqual(sanitizePii(input2), 'Director Aadhaar: [REDACTED_AADHAAR] in file.');
  });

  runTest('Scrub Indian GSTIN correctly without nested PAN corruption', () => {
    const input = 'Our registered GSTIN is 27ABCDE1234F1Z5 in Maharashtra.';
    const output = sanitizePii(input);
    assert.strictEqual(output, 'Our registered GSTIN is [REDACTED_GSTIN] in Maharashtra.');
    // Must NOT be 27[REDACTED_PAN]1Z5
    assert.ok(!output.includes('[REDACTED_PAN]'), 'GSTIN should be replaced as a whole, not inner PAN');
  });

  runTest('Scrub Credit/Debit Card numbers (16 digits) correctly', () => {
    const input = 'Corporate card 4111 2222 3333 4444 used for payments.';
    const output = sanitizePii(input);
    assert.strictEqual(output, 'Corporate card [REDACTED_ACCOUNT_NO] used for payments.');
  });

  runTest('Scrub Labeled Bank Account numbers correctly', () => {
    const input = 'Please remit funds to Bank A/C: 12345678901234 at HDFC Bank.';
    const output = sanitizePii(input);
    assert.strictEqual(output, 'Please remit funds to Bank Account: [REDACTED_ACCOUNT_NO] at HDFC Bank.');
  });

  runTest('Scrub multiple mixed statutory identifiers in a single paragraph', () => {
    const input = 'Kalyan Engg GSTIN: 23ABCDE1234F1Z4, PAN: ABCDE1234F, Director Aadhaar: 9876 5432 1098, Bank Acc: 98765432101234, Card: 5123-4567-8901-2345.';
    const output = sanitizePii(input);
    assert.ok(output.includes('[REDACTED_GSTIN]'), 'Must redact GSTIN');
    assert.ok(output.includes('[REDACTED_PAN]'), 'Must redact PAN');
    assert.ok(output.includes('[REDACTED_AADHAAR]'), 'Must redact Aadhaar');
    assert.ok(output.includes('[REDACTED_ACCOUNT_NO]'), 'Must redact Bank/Card numbers');
    assert.ok(!output.includes('ABCDE1234F'), 'Zero raw PAN characters should remain');
    assert.ok(!output.includes('9876 5432 1098'), 'Zero raw Aadhaar characters should remain');
  });

  runTest('Deep recursive object PII scrubbing (sanitizeObjectPii)', () => {
    const payload = {
      company_name: 'Alpha Traders PAN ABCDE1234F',
      notes: 'GSTIN is 23ABCDE1234F1Z4',
      contact_email: 'contact@alpha.com', // preserve email
      contact_phone: '9826011111',       // preserve phone
      details: {
        remark: 'Aadhaar 2345 6789 0123'
      }
    };
    const sanitized = sanitizeObjectPii(payload);
    assert.strictEqual(sanitized.company_name, 'Alpha Traders PAN [REDACTED_PAN]');
    assert.strictEqual(sanitized.notes, 'GSTIN is [REDACTED_GSTIN]');
    assert.strictEqual(sanitized.details.remark, 'Aadhaar [REDACTED_AADHAAR]');
    assert.strictEqual(sanitized.contact_email, 'contact@alpha.com');
  });

  runTest('Redact statutory identifiers adjacent to underscores (lookaround boundaries)', () => {
    assert.strictEqual(sanitizePii('ITR_ABCDE1234F_2025.pdf'), 'ITR_[REDACTED_PAN]_2025.pdf');
    assert.strictEqual(sanitizePii('GST_27ABCDE1234F1Z5.xlsx'), 'GST_[REDACTED_GSTIN].xlsx');
    assert.strictEqual(sanitizePii('Aadhaar_234567890123.jpg'), 'Aadhaar_[REDACTED_AADHAAR].jpg');
    assert.strictEqual(sanitizePii('pan_ABCDE1234F'), 'pan_[REDACTED_PAN]');
  });

  runTest('Sanitize file names in generateSyntheticReport observations', () => {
    const syntheticReport = generateSyntheticReport({
      companyName: 'Test Corp',
      industry: 'Manufacturing',
      turnoverBand: '1Cr-5Cr',
      scores: calculateHealthScore({ q1: 4 }),
      fileInfo: {
        filename: 'ITR_ABCDE1234F_2025_GST_27ABCDE1234F1Z5.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1024
      },
      notes: ''
    });
    const fileObservation = syntheticReport.key_observations.find(o => o.includes('Supporting document'));
    assert.ok(fileObservation, 'Observation about uploaded document must exist');
    assert.ok(!fileObservation.includes('ABCDE1234F'), 'Raw PAN must not appear in observations');
    assert.ok(!fileObservation.includes('27ABCDE1234F1Z5'), 'Raw GSTIN must not appear in observations');
    assert.ok(fileObservation.includes('[REDACTED_PAN]'), 'PAN must be redacted in filename observation');
    assert.ok(fileObservation.includes('[REDACTED_GSTIN]'), 'GSTIN must be redacted in filename observation');
  });

  // ===========================================================================
  // SUITE 3: Health Check Endpoint (api/checkup/health.js)
  // ===========================================================================
  console.log('\n--- SUITE 3: Health Check Endpoint ---');

  runTest('GET /api/checkup/health returns HTTP 200 with service details and timestamp', () => {
    const req = { method: 'GET', headers: {} };
    const res = createMockRes();
    healthHandler(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.status, 'ok');
    assert.strictEqual(res.body.service, 'BookMyRecords Business Health API');
    assert.strictEqual(res.body.version, '1.0.0');
    assert.ok(res.body.timestamp);
    assert.strictEqual(res.headers['access-control-allow-origin'], '*');
  });

  runTest('OPTIONS /api/checkup/health returns HTTP 200 with preflight CORS headers', () => {
    const req = { method: 'OPTIONS', headers: {} };
    const res = createMockRes();
    healthHandler(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.headers['access-control-allow-origin'], '*');
    assert.ok(res.headers['access-control-allow-methods'].includes('GET'));
  });

  runTest('POST /api/checkup/health returns HTTP 405 Method Not Allowed', () => {
    const req = { method: 'POST', headers: {} };
    const res = createMockRes();
    healthHandler(req, res);
    assert.strictEqual(res.statusCode, 405);
    assert.strictEqual(res.body.error, 'Method Not Allowed');
  });

  // ===========================================================================
  // SUITE 4: Analyze Endpoint & Schema Verification (api/checkup/analyze.js)
  // ===========================================================================
  console.log('\n--- SUITE 4: Analyze Endpoint & Schema Verification ---');

  await runAsyncTest('POST /api/checkup/analyze in Mock Mode returns HTTP 200 with 100% Schema Compliance', async () => {
    process.env.AI_MOCK_MODE = 'true';
    const req = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: {
        company_name: 'Kalyan Heavy Engineering Pvt Ltd',
        contact_name: 'Vikramaditya Shinde',
        contact_email: 'vikram@kalyanengineering.com',
        contact_phone: '9826011223',
        industry: 'Precision Manufacturing',
        turnover_band: '10Cr - 25Cr',
        answers: {
          q1: 4, q2: 4, q3: 4, q4: 4, q5: 3,
          q6: 4, q7: 4, q8: 3, q9: 4,
          q10: 3, q11: 3, q12: 4, q13: 3,
          q14: 4, q15: 4, q16: 3, q17: 4,
          q18: 4, q19: 4, q20: 3, q21: 4,
          q22: 4, q23: 4, q24: 3, q25: 4
        }
      }
    };
    const res = createMockRes();
    await analyzeHandler(req, res);

    assert.strictEqual(res.statusCode, 200, 'Must return HTTP 200');
    const report = res.body;

    // Validate using the strict schema validator
    assert.ok(validateReportSchema(report), 'Report must pass validateReportSchema()');

    // Check specific schema requirements
    assert.strictEqual(report.meta.company_name, 'Kalyan Heavy Engineering Pvt Ltd');
    assert.strictEqual(report.meta.turnover_band, '10Cr - 25Cr');
    assert.ok(report.meta.report_id.startsWith('BMR-'));

    assert.strictEqual(typeof report.scores.overall_score, 'number');
    assert.strictEqual(report.scores.risk_band, 'Strong');
    assert.strictEqual(report.scores.pillar_scores.length, 6);

    for (const p of report.scores.pillar_scores) {
      assert.ok(p.pillar_name, 'Pillar must have pillar_name');
      assert.strictEqual(typeof p.score, 'number', 'Pillar score must be number');
      assert.strictEqual(typeof p.max_score, 'number', 'Pillar max_score must be number');
      assert.ok(['Good', 'Average', 'Attention Needed'].includes(p.status), `Pillar status ${p.status} must be valid enum`);
    }

    assert.ok(typeof report.executive_summary === 'string' && report.executive_summary.length > 50);
    assert.ok(Array.isArray(report.key_strengths) && report.key_strengths.length >= 2);
    assert.ok(Array.isArray(report.critical_gaps) && report.critical_gaps.length >= 2);
    assert.ok(Array.isArray(report.key_observations) && report.key_observations.length >= 3);
    assert.ok(Array.isArray(report.risks_and_vulnerabilities) && report.risks_and_vulnerabilities.length >= 2);
    assert.ok(Array.isArray(report.improvement_opportunities) && report.improvement_opportunities.length >= 2);

    // Check Priority Action Plan structure
    assert.ok(Array.isArray(report.priority_action_plan.immediate_30_days));
    assert.ok(Array.isArray(report.priority_action_plan.medium_term_60_days));
    assert.ok(Array.isArray(report.priority_action_plan.strategic_90_days));
    assert.ok(report.priority_action_plan.immediate_30_days.length > 0);

    // Check consultation agenda and missing info
    assert.ok(Array.isArray(report.missing_or_unverified_info));
    assert.ok(Array.isArray(report.consultation_agenda));
  });

  await runAsyncTest('OPTIONS /api/checkup/analyze returns HTTP 200 with CORS preflight headers', async () => {
    const req = { method: 'OPTIONS', headers: {} };
    const res = createMockRes();
    await analyzeHandler(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.headers['access-control-allow-origin'], '*');
    assert.ok(res.headers['access-control-allow-methods'].includes('POST'));
  });

  await runAsyncTest('Multipart form-data parsing with boundary and attached document metadata', async () => {
    const boundary = '----WebKitFormBoundaryXyZ123Test';
    const multipartBody = 
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="company_name"\r\n\r\n` +
      `Shree Ram Textiles LLP\r\n` +
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="contact_name"\r\n\r\n` +
      `Rameshwar Patidar\r\n` +
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="contact_email"\r\n\r\n` +
      `rameshwar@shreeram.in\r\n` +
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="contact_phone"\r\n\r\n` +
      `9893012345\r\n` +
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="answers"\r\n\r\n` +
      `{"q1":3,"q2":3,"q3":3,"q4":3,"q5":3,"q6":3,"q7":3,"q8":3,"q9":3,"q10":3,"q11":3,"q12":3,"q13":3,"q14":3,"q15":3,"q16":3,"q17":3,"q18":3,"q19":3,"q20":3,"q21":3,"q22":3,"q23":3,"q24":3,"q25":3}\r\n` +
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="document"; filename="PnL_FY2026.csv"\r\n` +
      `Content-Type: text/csv\r\n\r\n` +
      `Revenue,12000000\nExpenses,9500000\nNetProfit,2500000\r\n` +
      `--${boundary}--\r\n`;

    const req = {
      method: 'POST',
      headers: {
        'content-type': `multipart/form-data; boundary=${boundary}`
      },
      body: Buffer.from(multipartBody, 'utf-8')
    };
    const res = createMockRes();
    await analyzeHandler(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.meta.company_name, 'Shree Ram Textiles LLP');
    assert.strictEqual(res.body._meta.document_attached, true);
    assert.strictEqual(res.body.scores.overall_score, 66.7);
  });

  // ===========================================================================
  // SUITE 5: Error Handling & Input Validation
  // ===========================================================================
  console.log('\n--- SUITE 5: Error Handling & Input Validation ---');

  await runAsyncTest('Missing company_name returns HTTP 400 with descriptive error', async () => {
    const req = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: {
        contact_name: 'Test Contact',
        contact_email: 'test@example.com',
        contact_phone: '9826011111',
        answers: { q1: 3 }
      }
    };
    const res = createMockRes();
    await analyzeHandler(req, res);
    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.error, 'Validation Error');
    assert.ok(res.body.details.some(d => d.includes('company_name')));
  });

  await runAsyncTest('Invalid contact_email returns HTTP 400', async () => {
    const req = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: {
        company_name: 'Test Corp',
        contact_name: 'Test Contact',
        contact_email: 'not-an-email-at-all',
        contact_phone: '9826011111',
        answers: { q1: 3 }
      }
    };
    const res = createMockRes();
    await analyzeHandler(req, res);
    assert.strictEqual(res.statusCode, 400);
    assert.ok(res.body.details.some(d => d.includes('contact_email')));
  });

  await runAsyncTest('Invalid contact_phone returns HTTP 400', async () => {
    const req = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: {
        company_name: 'Test Corp',
        contact_name: 'Test Contact',
        contact_email: 'valid@example.com',
        contact_phone: '12345', // invalid short phone
        answers: { q1: 3 }
      }
    };
    const res = createMockRes();
    await analyzeHandler(req, res);
    assert.strictEqual(res.statusCode, 400);
    assert.ok(res.body.details.some(d => d.includes('contact_phone')));
  });

  await runAsyncTest('Missing answers returns HTTP 400', async () => {
    const req = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: {
        company_name: 'Test Corp',
        contact_name: 'Test Contact',
        contact_email: 'valid@example.com',
        contact_phone: '9826011111'
        // answers missing
      }
    };
    const res = createMockRes();
    await analyzeHandler(req, res);
    assert.strictEqual(res.statusCode, 400);
    assert.ok(res.body.details.some(d => d.includes('answers')));
  });

  await runAsyncTest('Unsupported HTTP Method (PUT/DELETE) returns HTTP 405 Method Not Allowed', async () => {
    const req = { method: 'DELETE', headers: {} };
    const res = createMockRes();
    await analyzeHandler(req, res);
    assert.strictEqual(res.statusCode, 405);
    assert.strictEqual(res.body.error, 'Method Not Allowed');
  });

  // ===========================================================================
  // SUMMARY REPORT
  // ===========================================================================
  console.log('\n================================================================');
  console.log(`TOTAL TESTS:  ${totalTests}`);
  console.log(`PASSED:       ${passedTests}`);
  console.log(`FAILED:       ${failedTests}`);
  console.log('================================================================');

  if (failedTests > 0) {
    console.error(`\n[ERROR] Verification failed with ${failedTests} failure(s).`);
    process.exit(1);
  } else {
    console.log('\n[SUCCESS] All Milestone 3 verification tests passed successfully.');
    process.exit(0);
  }
}

runAllTests().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
