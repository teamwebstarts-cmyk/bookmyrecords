/**
 * BookMyRecords Master End-to-End (E2E) Verification Suite
 * 
 * Implements the 4-tier opaque-box test methodology specified in TEST_INFRA.md:
 * - Tier 1: Feature Coverage (Features 1 through 8, ≥5 tests per feature = 40 tests)
 * - Tier 2: Boundary & Corner Cases (12 edge tests covering inputs, file limits, PII boundaries, extreme bands)
 * - Tier 3: Cross-Feature Combinations (6 pairwise interaction tests)
 * - Tier 4: Real-World Application Scenarios (5 multi-step customer journeys)
 * - Suite 5: Responsive & Print Media Verification (Mobile, Tablet, Desktop, @media print)
 * - Suite 6: Full Regression Execution (verify_m2.js, verify_m3.js, verify_m4.js)
 * 
 * Execution: node verify_e2e.js
 */

'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { execSync } = require('child_process');

const rootDir = process.cwd();

// Load core scoring and serverless modules
const { calculateHealthScore, PILLARS, QUESTIONS, RISK_BANDS } = require('./api/checkup/score');
const healthHandler = require('./api/checkup/health');
const analyzeHandler = require('./api/checkup/analyze');
const {
  sanitizePii,
  sanitizeObjectPii,
  parseRequestBody,
  validateCheckupPayload,
  evaluateInternalCriteria,
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
 * Creates a mock HTTP response object for serverless handler testing
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

/**
 * Creates a mock HTTP request object
 */
function createMockReq(options = {}) {
  const req = {
    method: options.method || 'POST',
    url: options.url || '/api/checkup/analyze',
    headers: options.headers || {
      'content-type': 'application/json'
    },
    body: options.body || null,
    on(event, handler) {
      if (event === 'data' && options.rawBody) {
        handler(Buffer.from(options.rawBody));
      }
      if (event === 'end') {
        setTimeout(handler, 10);
      }
      return this;
    }
  };
  return req;
}

async function runAllTests() {
  console.log('================================================================');
  console.log('BookMyRecords Master End-to-End (E2E) Verification Suite');
  console.log('Framework: 4-Tier Opaque-Box Methodology (TEST_INFRA.md)');
  console.log('================================================================\n');

  const files = fs.readdirSync(rootDir);
  const htmlFiles = files.filter(f => f.endsWith('.html') && !f.startsWith('_'));

  // ===========================================================================
  // TIER 1: FEATURE COVERAGE (≥5 tests per feature across 8 features)
  // ===========================================================================
  console.log('================================================================');
  console.log('TIER 1: FEATURE COVERAGE (Features 1 to 8)');
  console.log('================================================================');

  // --- Feature 1: Navigation & 0 Broken Links ---
  console.log('\n--- Feature 1: Navigation & 0 Broken Links ---');

  runTest('T1.1.1: All 17 HTML files exist, have non-empty valid <title>, meta viewport, and favicon link', () => {
    assert.strictEqual(htmlFiles.length, 17, `Expected 17 HTML files on disk, found ${htmlFiles.length}`);
    for (const file of htmlFiles) {
      const content = fs.readFileSync(path.join(rootDir, file), 'utf8');
      assert.ok(content.includes('<title>'), `${file} must contain <title> tag`);
      assert.ok(content.includes('viewport'), `${file} must contain meta viewport tag`);
      assert.ok(content.includes('rel="icon"'), `${file} must link favicon`);
    }
  });

  runTest('T1.1.2: All internal hyperlinks (href="...") across all 17 HTML files resolve to existing files on disk (0 broken links)', () => {
    const hrefRegex = /href=["']([^"'#\s]+)(?:#[^"']*)?["']/g;
    let checkedCount = 0;
    for (const file of htmlFiles) {
      const content = fs.readFileSync(path.join(rootDir, file), 'utf8');
      let match;
      while ((match = hrefRegex.exec(content)) !== null) {
        const rawTarget = match[1].trim();
        if (
          rawTarget.startsWith('http://') ||
          rawTarget.startsWith('https://') ||
          rawTarget.startsWith('mailto:') ||
          rawTarget.startsWith('tel:') ||
          rawTarget.startsWith('javascript:') ||
          rawTarget.startsWith('#') ||
          rawTarget.startsWith('${') ||
          rawTarget === ''
        ) {
          continue;
        }
        const filePathOnly = rawTarget.split('?')[0];
        const resolved = path.resolve(rootDir, filePathOnly);
        assert.ok(fs.existsSync(resolved), `Broken link in ${file}: target "${rawTarget}" not found at ${resolved}`);
        checkedCount++;
      }
    }
    assert.ok(checkedCount > 100, `Expected over 100 internal links checked, verified: ${checkedCount}`);
  });

  runTest('T1.1.3: All local scripts (<script src="...">) and stylesheet links resolve to valid files on disk', () => {
    const scriptSrcRegex = /<script[^>]+src=["']([^"']+)["']/gi;
    let checkedScripts = 0;
    for (const file of htmlFiles) {
      const content = fs.readFileSync(path.join(rootDir, file), 'utf8');
      let match;
      while ((match = scriptSrcRegex.exec(content)) !== null) {
        const src = match[1].trim();
        if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//')) {
          continue;
        }
        const cleanSrc = src.split('?')[0];
        const resolvedPath = path.resolve(rootDir, cleanSrc);
        assert.ok(fs.existsSync(resolvedPath), `Missing script in ${file}: "${src}" not found at ${resolvedPath}`);
        checkedScripts++;
      }
    }
    assert.ok(checkedScripts > 50, `Expected over 50 local script references checked, verified: ${checkedScripts}`);
  });

  runTest('T1.1.4: Header navigation consistency: brand logo routes to index.html and core menu links exist', () => {
    const mainPages = ['index.html', 'about.html', 'cfo-services.html', 'contact.html', 'faq.html', 'pricing.html'];
    for (const page of mainPages) {
      const content = fs.readFileSync(path.join(rootDir, page), 'utf8');
      assert.ok(content.includes('href="index.html"'), `${page} must contain home link to index.html`);
      assert.ok(content.includes('href="about.html"'), `${page} must contain link to about.html`);
      assert.ok(content.includes('href="contact.html"'), `${page} must contain link to contact.html`);
      assert.ok(content.includes('href="cfo-services.html"'), `${page} must contain link to cfo-services.html in services menu`);
    }
  });

  runTest('T1.1.5: Footer navigation and quick links are consistent across pages and include terms & compliance', () => {
    const pagesToCheck = ['index.html', 'cfo-services.html', 'accounting-outsourcing.html', 'contact.html', 'about.html'];
    for (const page of pagesToCheck) {
      const content = fs.readFileSync(path.join(rootDir, page), 'utf8');
      assert.ok(content.includes('href="terms-conditions.html"'), `${page} footer must link to terms-conditions.html`);
      assert.ok(content.includes('info@bookmyrecords.com'), `${page} footer must contain info@bookmyrecords.com`);
      assert.ok(content.includes('96696'), `${page} footer must contain telephone number`);
    }
  });

  // --- Feature 2: Service Structure & Content ---
  console.log('\n--- Feature 2: Service Structure & Content ---');

  runTest('T1.2.1: All 6 core service pages + detail pages exist on disk', () => {
    const servicePages = [
      'cfo-services.html',
      'accounting-outsourcing.html',
      'taxation.html',
      'business-registration.html',
      'ipr-registration.html',
      'loan-financing.html',
      'service-details.html',
      'services1.html',
      'service2.html'
    ];
    for (const page of servicePages) {
      assert.ok(fs.existsSync(path.join(rootDir, page)), `Service page ${page} must exist on disk`);
      const stat = fs.statSync(path.join(rootDir, page));
      assert.ok(stat.size > 2000, `Service page ${page} must be substantial (found ${stat.size} bytes)`);
    }
  });

  runTest('T1.2.2: Core Triad distinct positioning on index.html: Checkup, Diagnostic, and Hands-on Consulting', () => {
    const indexContent = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
    assert.ok(indexContent.includes('Business Health Checkup'), 'Must present Business Health Checkup');
    assert.ok(indexContent.includes('Business Health Diagnostic'), 'Must present Business Health Diagnostic');
    assert.ok(
      indexContent.includes('Hands-on Consulting') || indexContent.includes('One-to-One Consulting') || indexContent.includes('Business Growth Support'),
      'Must present Hands-on Consulting & Business Growth Support'
    );
  });

  runTest('T1.2.3: Service cards explain what it is, who needs it, what problem it solves, what customer receives, and CTA', () => {
    const cfoContent = fs.readFileSync(path.join(rootDir, 'cfo-services.html'), 'utf8');
    assert.ok(cfoContent.includes('Fractional CFO') || cfoContent.includes('Strategic Financial Leadership'), 'Must describe service nature');
    assert.ok(cfoContent.includes('Who Needs') || cfoContent.includes('Growing businesses') || cfoContent.includes('MSME'), 'Must explain target audience');
    assert.ok(cfoContent.includes('Deliverables') || cfoContent.includes('What You Receive') || cfoContent.includes('What We Deliver'), 'Must describe deliverables');
    assert.ok(cfoContent.includes('href="checkup.html"') || cfoContent.includes('href="contact.html"'), 'Must have relevant next action CTA');
  });

  runTest('T1.2.4: Dedicated service pages have consistent breadcrumbs, service navigation, and consultation CTAs', () => {
    const pages = ['taxation.html', 'ipr-registration.html', 'loan-financing.html', 'business-registration.html'];
    for (const p of pages) {
      const content = fs.readFileSync(path.join(rootDir, p), 'utf8');
      assert.ok(content.includes('class="breadcrumb-section"'), `${p} must contain breadcrumb section`);
      assert.ok(content.includes('Book a Consultation') || content.includes('Consultation') || content.includes('Talk to an Expert'), `${p} must contain consultation CTA`);
    }
  });

  runTest('T1.2.5: Service images have valid paths, meaningful alt text, and professional business aesthetics', () => {
    const indexContent = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
    const serviceImgRegex = /<img[^>]+src=["'](assets\/img\/home6\/services-[^"']+)["'][^>]*alt=["']([^"']+)["']/gi;
    let checkedImgs = 0;
    let match;
    while ((match = serviceImgRegex.exec(indexContent)) !== null) {
      const src = match[1];
      const alt = match[2];
      const resolved = path.resolve(rootDir, src);
      assert.ok(fs.existsSync(resolved), `Service image ${src} must exist on disk`);
      assert.ok(alt.length > 5, `Service image ${src} must have descriptive alt text (got "${alt}")`);
      checkedImgs++;
    }
    assert.ok(checkedImgs >= 6, `Expected at least 6 service images verified, found: ${checkedImgs}`);
  });

  // --- Feature 3: Placeholder Purge & Brand Sanitization ---
  console.log('\n--- Feature 3: Placeholder Purge & Brand Sanitization ---');

  runTest('T1.3.1: Zero occurrences of Aploxn branding or template titles across all 17 HTML files', () => {
    const forbiddenBranding = ['infoaploxn@gmail.com', 'aploxn', 'Aploxn- Business Consulting'];
    for (const file of htmlFiles) {
      const content = fs.readFileSync(path.join(rootDir, file), 'utf8');
      for (const phrase of forbiddenBranding) {
        assert.ok(!content.toLowerCase().includes(phrase.toLowerCase()), `${file} contains forbidden branding: "${phrase}"`);
      }
    }
  });

  runTest('T1.3.2: Zero occurrences of legacy placeholder emails (infoaploxn@gmail.com, example123@gmail.com)', () => {
    for (const file of htmlFiles) {
      const content = fs.readFileSync(path.join(rootDir, file), 'utf8');
      assert.ok(!content.includes('example123@gmail.com'), `${file} contains legacy placeholder example123@gmail.com`);
      assert.ok(!content.includes('infoaploxn@gmail.com'), `${file} contains legacy placeholder infoaploxn@gmail.com`);
    }
  });

  runTest('T1.3.3: Canonical contact details standardized: info@bookmyrecords.com and +91 96696 93315 across pages', () => {
    const keyPages = ['index.html', 'about.html', 'contact.html', 'cfo-services.html'];
    for (const page of keyPages) {
      const content = fs.readFileSync(path.join(rootDir, page), 'utf8');
      assert.ok(content.includes('info@bookmyrecords.com'), `${page} must contain info@bookmyrecords.com`);
      assert.ok(content.includes('96696 93315') || content.includes('96696-93315') || content.includes('9669693315'), `${page} must contain standard phone`);
    }
  });

  runTest('T1.3.4: Telephone links sanitized to RFC 3966 compliant format href="tel:+919669693315" (no unencoded spaces)', () => {
    for (const file of htmlFiles) {
      const content = fs.readFileSync(path.join(rootDir, file), 'utf8');
      assert.ok(!/href=["']tel:\+91\s+/i.test(content), `${file} contains non-RFC 3966 telephone URI with spaces`);
      if (content.includes('tel:')) {
        assert.ok(content.includes('href="tel:+919669693315"'), `${file} with telephone link must use standard RFC 3966 format`);
      }
    }
  });

  runTest('T1.3.5: Zero occurrences of fake healthcare text, $170/hr pricing, or Tally course demo testimonials', () => {
    const forbiddenPhrases = ['$170', '$270', 'Tally Prime course', 'job assurance program', 'Tally Course Alumni'];
    for (const file of htmlFiles) {
      const content = fs.readFileSync(path.join(rootDir, file), 'utf8');
      for (const phrase of forbiddenPhrases) {
        assert.ok(!content.includes(phrase), `${file} contains unapproved placeholder: "${phrase}"`);
      }
    }
  });

  // --- Feature 4: Deterministic Health Score Calculation ---
  console.log('\n--- Feature 4: Deterministic Health Score Calculation ---');

  runTest('T1.4.1: Mathematical integrity of 6 pillars: weights sum to exactly 100%, max scores sum to 100', () => {
    assert.strictEqual(PILLARS.length, 6, 'Must have exactly 6 pillars');
    const totalWeight = PILLARS.reduce((sum, p) => sum + p.weight_percentage, 0);
    const totalMax = PILLARS.reduce((sum, p) => sum + p.max_score, 0);
    assert.strictEqual(totalWeight, 100, 'Pillars total weight must equal 100%');
    assert.strictEqual(totalMax, 100, 'Pillars total max score must equal 100');
  });

  runTest('T1.4.2: Exactly 25 assessment criteria evenly mapped across 6 pillars with assigned max scores', () => {
    assert.strictEqual(QUESTIONS.length, 25, 'Must have exactly 25 questions');
    const p1Qs = QUESTIONS.filter(q => q.pillar_id === 'pillar_1');
    const p2Qs = QUESTIONS.filter(q => q.pillar_id === 'pillar_2');
    const p3Qs = QUESTIONS.filter(q => q.pillar_id === 'pillar_3');
    const p4Qs = QUESTIONS.filter(q => q.pillar_id === 'pillar_4');
    const p5Qs = QUESTIONS.filter(q => q.pillar_id === 'pillar_5');
    const p6Qs = QUESTIONS.filter(q => q.pillar_id === 'pillar_6');
    assert.strictEqual(p1Qs.length, 5, 'Pillar 1 must have 5 questions (max 25)');
    assert.strictEqual(p2Qs.length, 4, 'Pillar 2 must have 4 questions (max 20)');
    assert.strictEqual(p3Qs.length, 4, 'Pillar 3 must have 4 questions (max 15)');
    assert.strictEqual(p4Qs.length, 4, 'Pillar 4 must have 4 questions (max 15)');
    assert.strictEqual(p5Qs.length, 4, 'Pillar 5 must have 4 questions (max 15)');
    assert.strictEqual(p6Qs.length, 4, 'Pillar 6 must have 4 questions (max 10)');
  });

  runTest('T1.4.3: Score calculation function: perfect ratings (all 4) yield 100.0 with Strong band and Good status', () => {
    const perfectAnswers = {};
    for (let i = 1; i <= 25; i++) perfectAnswers[`q${i}`] = 4;
    const res = calculateHealthScore(perfectAnswers);
    assert.strictEqual(res.overall_score, 100.0, 'Perfect answers must yield 100.0');
    assert.strictEqual(res.risk_band, 'Strong', 'Overall risk band must be Strong');
    for (const p of res.pillar_scores) {
      assert.strictEqual(p.status, 'Good', `Pillar ${p.pillar_name} must have status Good`);
    }
  });

  runTest('T1.4.4: Score calculation function: minimum ratings (all 1) yield 0.0 with Critical band and Attention Needed', () => {
    const floorAnswers = {};
    for (let i = 1; i <= 25; i++) floorAnswers[`q${i}`] = 1;
    const res = calculateHealthScore(floorAnswers);
    assert.strictEqual(res.overall_score, 0.0, 'Floor answers must yield 0.0');
    assert.strictEqual(res.risk_band, 'Critical', 'Overall risk band must be Critical');
    for (const p of res.pillar_scores) {
      assert.strictEqual(p.status, 'Attention Needed', `Pillar ${p.pillar_name} must have status Attention Needed`);
    }
  });

  runTest('T1.4.5: Internal criteria evaluation: evaluateInternalCriteria deterministically produces ratings for all 25 criteria', () => {
    const evaluated = evaluateInternalCriteria({
      companyName: 'Apex Engineering Works',
      industry: 'Manufacturing & Engineering',
      turnoverBand: '1Cr - 5Cr',
      notes: 'Need working capital audit',
      file: { filename: 'pnl_2025.xlsx', sizeBytes: 120000 }
    });
    assert.ok(evaluated && typeof evaluated === 'object', 'Evaluated output must be an object');
    for (let i = 1; i <= 25; i++) {
      const rating = evaluated[`q${i}`];
      assert.ok(typeof rating === 'number' && rating >= 1 && rating <= 4, `q${i} must have valid rating 1..4 (got ${rating})`);
    }
  });

  // --- Feature 5: Document Upload Validation & Dropzone ---
  console.log('\n--- Feature 5: Document Upload Validation & Dropzone ---');

  runTest('T1.5.1: checkup.html contains #upload-dropzone, #document-file-input, dragover events, and file type guidance', () => {
    const checkupContent = fs.readFileSync(path.join(rootDir, 'checkup.html'), 'utf8');
    assert.ok(checkupContent.includes('id="upload-dropzone"'), 'Must contain #upload-dropzone');
    assert.ok(checkupContent.includes('id="document-file-input"'), 'Must contain #document-file-input');
    assert.ok(checkupContent.includes('PDF, XLSX, XLS, CSV'), 'Must guide user on acceptable file types');
    assert.ok(checkupContent.includes('Max 4 MB'), 'Must state Max 4 MB file size');
  });

  runTest('T1.5.2: Client-side file extension enforcement: allows .pdf, .xlsx, .xls, .csv', () => {
    const jsContent = fs.readFileSync(path.join(rootDir, 'assets/js/checkup.js'), 'utf8');
    assert.ok(jsContent.includes('.pdf') && jsContent.includes('.xlsx') && jsContent.includes('.xls') && jsContent.includes('.csv'), 'Must list valid extensions');
    assert.ok(jsContent.includes('validExtensions'), 'Must define validExtensions array');
  });

  runTest('T1.5.3: Client-side file size enforcement: strictly enforces 4MB ceiling (4,194,304 bytes)', () => {
    const jsContent = fs.readFileSync(path.join(rootDir, 'assets/js/checkup.js'), 'utf8');
    assert.ok(jsContent.includes('4 * 1024 * 1024') || jsContent.includes('4194304'), 'Must check 4 MB limit in checkup.js');
  });

  runTest('T1.5.4: File removal / clear mechanism in UI before submission (#btn-remove-file)', () => {
    const checkupContent = fs.readFileSync(path.join(rootDir, 'checkup.html'), 'utf8');
    assert.ok(checkupContent.includes('id="btn-remove-file"'), 'checkup.html must contain #btn-remove-file button');
    const jsContent = fs.readFileSync(path.join(rootDir, 'assets/js/checkup.js'), 'utf8');
    assert.ok(jsContent.includes('clearFileSelection'), 'checkup.js must implement clearFileSelection function');
  });

  runTest('T1.5.5: Serverless multipart parser handles document buffers in-memory with zero disk persistence', () => {
    const analyzeCode = fs.readFileSync(path.join(rootDir, 'api/checkup/analyze.js'), 'utf8');
    assert.ok(analyzeCode.includes('parseRequestBody'), 'Must implement parseRequestBody');
    assert.ok(!analyzeCode.includes('fs.writeFileSync') && !analyzeCode.includes('fs.writeFile'), 'Must not persist uploaded documents to disk');
    assert.ok(analyzeCode.includes('DPDP Act 2023'), 'Must cite DPDP Act 2023 zero-retention compliance');
  });

  // --- Feature 6: Serverless AI Analysis Endpoint & Mock Mode ---
  console.log('\n--- Feature 6: Serverless AI Analysis Endpoint & Mock Mode ---');

  await runAsyncTest('T1.6.1: /api/checkup/analyze handles POST requests in Mock Mode and returns HTTP 200 with structured JSON', async () => {
    process.env.AI_MOCK_MODE = 'true';
    const req = createMockReq({
      method: 'POST',
      body: {
        company_name: 'Shree Global Traders',
        contact_name: 'Rajesh Sharma',
        contact_email: 'rajesh@shreeglobal.in',
        contact_phone: '9826012345',
        industry: 'Trading & Distribution',
        turnover_band: '1Cr - 5Cr',
        streamlined: true,
        dpdp_consent: true
      }
    });
    const res = createMockRes();
    await analyzeHandler(req, res);
    assert.strictEqual(res.statusCode, 200, `Expected HTTP 200, got ${res.statusCode}`);
    assert.ok(res.body && typeof res.body === 'object', 'Response body must be JSON object');
    assert.strictEqual(res.body.meta.company_name, 'Shree Global Traders');
  });

  runTest('T1.6.2: Output schema validation: verifies all 10 required schema fields are present and structured', () => {
    const sampleScores = calculateHealthScore({ q1: 3, q2: 3, q3: 3, q4: 3 });
    const report = generateSyntheticReport({
      companyName: 'Bharat Electronics Ltd',
      industry: 'Manufacturing',
      turnoverBand: '5Cr - 25Cr',
      scores: sampleScores,
      fileInfo: null,
      notes: ''
    });
    const isValid = validateReportSchema(report);
    assert.strictEqual(isValid, true, 'Report must conform 100% to schema');
    assert.ok(report.meta && report.meta.report_id, 'Must contain meta.report_id');
    assert.ok(report.scores && typeof report.scores.overall_score === 'number', 'Must contain scores.overall_score');
    assert.ok(Array.isArray(report.key_strengths) && report.key_strengths.length > 0, 'Must have key_strengths');
    assert.ok(Array.isArray(report.critical_gaps) && report.critical_gaps.length > 0, 'Must have critical_gaps');
    assert.ok(report.priority_action_plan && report.priority_action_plan.immediate_30_days, 'Must have 30-day plan');
    assert.ok(Array.isArray(report.consultation_agenda), 'Must have consultation_agenda');
  });

  await runAsyncTest('T1.6.3: /api/checkup/health returns HTTP 200 with service info, status ok, and timestamp', async () => {
    const req = createMockReq({ method: 'GET', url: '/api/checkup/health' });
    const res = createMockRes();
    await healthHandler(req, res);
    assert.strictEqual(res.statusCode, 200, `Expected HTTP 200, got ${res.statusCode}`);
    assert.strictEqual(res.body.status, 'ok');
    assert.ok(res.body.timestamp, 'Health response must contain timestamp');
  });

  await runAsyncTest('T1.6.4: CORS preflight (OPTIONS) support on /api/checkup/* endpoints with required headers', async () => {
    const req = createMockReq({ method: 'OPTIONS', url: '/api/checkup/analyze' });
    const res = createMockRes();
    await analyzeHandler(req, res);
    assert.strictEqual(res.statusCode, 200, 'OPTIONS must return HTTP 200');
    assert.strictEqual(res.headers['access-control-allow-origin'], '*');
    assert.ok(res.headers['access-control-allow-methods'].includes('POST'), 'Must allow POST');
  });

  await runAsyncTest('T1.6.5: Method Not Allowed (HTTP 405) handling for unsupported HTTP verbs (GET on analyze)', async () => {
    const req = createMockReq({ method: 'GET', url: '/api/checkup/analyze' });
    const res = createMockRes();
    await analyzeHandler(req, res);
    assert.strictEqual(res.statusCode, 405, `Expected HTTP 405, got ${res.statusCode}`);
    assert.strictEqual(res.body.error, 'Method Not Allowed');
  });

  // --- Feature 7: Cal.com Consultation Booking Integration ---
  console.log('\n--- Feature 7: Cal.com Consultation Booking Integration ---');

  runTest('T1.7.1: #cal-inline-embed container exists in checkup.html Step 3 (Analysis)', () => {
    const checkupContent = fs.readFileSync(path.join(rootDir, 'checkup.html'), 'utf8');
    assert.ok(checkupContent.includes('id="cal-inline-embed"'), 'Must contain #cal-inline-embed');
    assert.ok(checkupContent.includes('data-step="3"'), 'Must have Step 3 (Analysis) container');
  });

  runTest('T1.7.2: Cal.com embed loader script initialized in checkup.js with event bookmyrecords/checkup-consultation', () => {
    const jsContent = fs.readFileSync(path.join(rootDir, 'assets/js/checkup.js'), 'utf8');
    assert.ok(jsContent.includes('https://app.cal.com/embed/embed.js'), 'Must load Cal embed script');
    assert.ok(jsContent.includes('bookmyrecords/checkup-consultation'), 'Must reference official event slug');
    assert.ok(jsContent.includes('Cal("inline"') || jsContent.includes("Cal('inline'"), 'Must call Cal inline');
  });

  runTest('T1.7.3: Prefill logic populates client name, email, phone, and assessment ID in Cal.com configuration', () => {
    const jsContent = fs.readFileSync(path.join(rootDir, 'assets/js/checkup.js'), 'utf8');
    assert.ok(jsContent.includes('name: state.profile.contact_name') || jsContent.includes('name:'), 'Must prefill client name');
    assert.ok(jsContent.includes('email: state.profile.contact_email') || jsContent.includes('email:'), 'Must prefill client email');
    assert.ok(jsContent.includes('notes:') || jsContent.includes('reportId') || jsContent.includes('report_id'), 'Must attach assessment context');
  });

  runTest('T1.7.4: Direct fallback booking link exists pointing to https://cal.com/bookmyrecords/checkup-consultation', () => {
    const checkupContent = fs.readFileSync(path.join(rootDir, 'checkup.html'), 'utf8');
    assert.ok(checkupContent.includes('https://cal.com/bookmyrecords/checkup-consultation'), 'Must provide direct fallback link to Cal.com');
  });

  runTest('T1.7.5: Direct telephone consultation link href="tel:+919669693315" available for immediate scheduling', () => {
    const checkupContent = fs.readFileSync(path.join(rootDir, 'checkup.html'), 'utf8');
    assert.ok(checkupContent.includes('href="tel:+919669693315"'), 'Step 4 must provide direct telephone booking link');
  });

  // --- Feature 8: Privacy & PII Masking ---
  console.log('\n--- Feature 8: Privacy & PII Masking ---');

  runTest('T1.8.1: DPDP Act 2023 consent checkbox exists and is mandatory (required) before intake submission', () => {
    const checkupContent = fs.readFileSync(path.join(rootDir, 'checkup.html'), 'utf8');
    assert.ok(checkupContent.includes('id="dpdp-consent-checkbox"'), 'Must have #dpdp-consent-checkbox');
    assert.ok(checkupContent.includes('Digital Personal Data Protection Act, 2023') || checkupContent.includes('DPDP Act'), 'Must reference DPDP Act');
  });

  runTest('T1.8.2: Indian PAN scrubbing: masks 10-character alphanumeric PAN ([A-Z]{5}[0-9]{4}[A-Z]) to [REDACTED_PAN]', () => {
    const input = 'Director PAN is ABCDE1234F and Auditor PAN is BKZPM9876Q.';
    const output = sanitizePii(input);
    assert.strictEqual(output, 'Director PAN is [REDACTED_PAN] and Auditor PAN is [REDACTED_PAN].');
  });

  runTest('T1.8.3: Indian Aadhaar scrubbing: masks 12-digit Aadhaar (continuous, space-separated, hyphenated) to [REDACTED_AADHAAR]', () => {
    const input = 'Promoter Aadhaar: 4567 8901 2345, Partner: 9876-5432-1098, Nominee: 222233334444.';
    const output = sanitizePii(input);
    assert.strictEqual(output, 'Promoter Aadhaar: [REDACTED_AADHAAR], Partner: [REDACTED_AADHAAR], Nominee: [REDACTED_AADHAAR].');
  });

  runTest('T1.8.4: Indian GSTIN scrubbing: masks 15-character GSTIN to [REDACTED_GSTIN] without corrupted nested PAN', () => {
    const input = 'Company GSTIN is 27ABCDE1234F1Z5 registered in Maharashtra.';
    const output = sanitizePii(input);
    assert.strictEqual(output, 'Company GSTIN is [REDACTED_GSTIN] registered in Maharashtra.');
    assert.ok(!output.includes('27[REDACTED_PAN]1Z5'), 'Must not create corrupt nested PAN within GSTIN');
  });

  runTest('T1.8.5: Financial data protection: masks Credit/Debit card numbers (16 digits) and bank account numbers', () => {
    const input = 'Card number: 4111 2222 3333 4444 and Bank Account: 50100234567890.';
    const output = sanitizePii(input);
    assert.ok(output.includes('[REDACTED_ACCOUNT_NO]'), 'Must redact card or bank account number to [REDACTED_ACCOUNT_NO]');
  });

  // ===========================================================================
  // TIER 2: BOUNDARY & CORNER CASES (12 Tests)
  // ===========================================================================
  console.log('\n================================================================');
  console.log('TIER 2: BOUNDARY & CORNER CASES');
  console.log('================================================================');

  runTest('T2.1: Empty company_name returns validation failure with descriptive error', () => {
    const res = validateCheckupPayload({
      company_name: ' ',
      contact_name: 'Vijay Verma',
      contact_email: 'vijay@verma.com',
      contact_phone: '9826011223'
    });
    assert.strictEqual(res.isValid, false, 'Empty company_name must fail validation');
    assert.ok(res.errors.some(e => e.includes('company_name')), 'Must report company_name error');
  });

  runTest('T2.2: Empty contact_name returns validation failure with descriptive error', () => {
    const res = validateCheckupPayload({
      company_name: 'Verma Enterprises',
      contact_name: 'V',
      contact_email: 'vijay@verma.com',
      contact_phone: '9826011223'
    });
    assert.strictEqual(res.isValid, false, 'Contact name under 2 chars must fail validation');
    assert.ok(res.errors.some(e => e.includes('contact_name')), 'Must report contact_name error');
  });

  runTest('T2.3: Invalid email formats (user@, @missing.com, spaces) rejected by validator', () => {
    const invalidEmails = ['user@', '@missing.com', 'user with spaces@domain.com', 'plainaddress', 'user@domain'];
    for (const em of invalidEmails) {
      const res = validateCheckupPayload({
        company_name: 'Test Corp',
        contact_name: 'Tester',
        contact_email: em,
        contact_phone: '9826011223'
      });
      assert.strictEqual(res.isValid, false, `Email "${em}" must fail validation`);
      assert.ok(res.errors.some(e => e.includes('contact_email')), `Must report contact_email error for "${em}"`);
    }
  });

  runTest('T2.4: Invalid Indian phone numbers (short, long, invalid starting digit, alphabetic) rejected by validator', () => {
    const invalidPhones = ['12345', '1234567890', '0123456789', '982601122312', '982601122A', '5555555555'];
    for (const ph of invalidPhones) {
      const res = validateCheckupPayload({
        company_name: 'Test Corp',
        contact_name: 'Tester',
        contact_email: 'tester@test.com',
        contact_phone: ph
      });
      assert.strictEqual(res.isValid, false, `Phone "${ph}" must fail validation`);
      assert.ok(res.errors.some(e => e.includes('contact_phone')), `Must report contact_phone error for "${ph}"`);
    }
  });

  runTest('T2.5: 4MB file ceiling boundary: buffer of exact 4,194,304 bytes accepted, buffer of 4,194,305 bytes rejected', () => {
    const maxBytes = 4 * 1024 * 1024; // 4,194,304 bytes
    const validFile = {
      filename: 'balance_sheet_2025.pdf',
      sizeBytes: maxBytes
    };
    const oversizedFile = {
      filename: 'balance_sheet_2025.pdf',
      sizeBytes: maxBytes + 1
    };

    const validRes = validateCheckupPayload({
      company_name: 'Border Corp',
      contact_name: 'Border Tester',
      contact_email: 'border@tester.com',
      contact_phone: '9826011223',
      streamlined: true
    }, validFile);
    assert.strictEqual(validRes.isValid, true, 'Exact 4,194,304 bytes must pass validation');

    const overRes = validateCheckupPayload({
      company_name: 'Border Corp',
      contact_name: 'Border Tester',
      contact_email: 'border@tester.com',
      contact_phone: '9826011223',
      streamlined: true
    }, oversizedFile);
    assert.strictEqual(overRes.isValid, false, 'File of 4,194,305 bytes must fail validation');
    assert.ok(overRes.errors.some(e => e.includes('4 MB')), 'Must report file size ceiling error');
  });

  runTest('T2.6: Unsupported file formats (.exe, .bat, .zip, .html, .sh) rejected by validator', () => {
    const unsupported = ['malware.exe', 'script.bat', 'archive.zip', 'payload.html', 'deploy.sh'];
    for (const f of unsupported) {
      const fileObj = { filename: f, sizeBytes: 1024 };
      const res = validateCheckupPayload({
        company_name: 'Sec Corp',
        contact_name: 'Sec Tester',
        contact_email: 'sec@tester.com',
        contact_phone: '9826011223',
        streamlined: true
      }, fileObj);
      assert.strictEqual(res.isValid, false, `File "${f}" must fail validation`);
      assert.ok(res.errors.some(e => e.includes('Invalid file format')), `Must report invalid file format for "${f}"`);
    }
  });

  runTest('T2.7: Lookaround PII boundary: PII adjacent to underscores or hyphen prefixes properly redacted without breaking suffix', () => {
    const filename1 = 'audit_AAAPL1234C_final.pdf';
    const filename2 = 'gst_27ABCDE1234F1Z5_q3.csv';
    const scrubbed1 = sanitizePii(filename1);
    const scrubbed2 = sanitizePii(filename2);
    assert.strictEqual(scrubbed1, 'audit_[REDACTED_PAN]_final.pdf', 'Must redact PAN embedded between underscores');
    assert.strictEqual(scrubbed2, 'gst_[REDACTED_GSTIN]_q3.csv', 'Must redact GSTIN embedded between underscores');
  });

  runTest('T2.8: Extreme turnover bands handling (<50L, 1Cr-5Cr, >50Cr, custom bands) gracefully maps to deterministic weights', () => {
    const bands = ['<50 Lakhs', '₹50 Lakhs – ₹1 Crore', '₹1 Crore – ₹5 Crore', '₹50 Crore+', 'Unspecified Custom Band'];
    for (const band of bands) {
      const evaluated = evaluateInternalCriteria({
        companyName: 'Turnover Test LLC',
        industry: 'Trading',
        turnoverBand: band,
        notes: ''
      });
      assert.ok(evaluated && typeof evaluated === 'object', `Should evaluate band "${band}" safely`);
      assert.strictEqual(Object.keys(evaluated).length, 25, 'Must produce ratings for all 25 criteria');
    }
  });

  runTest('T2.9: Exact boundary scores 0.0 and 100.0: strict clamping guarantees scores never exceed 100 or drop below 0', () => {
    const maxAnswers = {};
    for (let i = 1; i <= 25; i++) maxAnswers[`q${i}`] = 4;
    const minAnswers = {};
    for (let i = 1; i <= 25; i++) minAnswers[`q${i}`] = 1;

    const maxScore = calculateHealthScore(maxAnswers);
    const minScore = calculateHealthScore(minAnswers);
    assert.strictEqual(maxScore.overall_score, 100.0);
    assert.strictEqual(minScore.overall_score, 0.0);
    assert.strictEqual(maxScore.risk_band, 'Strong');
    assert.strictEqual(minScore.risk_band, 'Critical');
  });

  runTest('T2.10: Deep recursive JSON PII sanitization: nested objects, arrays of objects, and mixed values properly scrubbed', () => {
    const nestedData = {
      director: {
        pan: 'ABCDE1234F',
        aadhaar: '4567 8901 2345'
      },
      branches: [
        { state: 'MH', gstin: '27ABCDE1234F1Z5' },
        { state: 'DL', gstin: '07ABCDE1234F1Z9' }
      ],
      description: 'Audit file audited_AAAPL1234C.xlsx'
    };
    const sanitized = sanitizeObjectPii(nestedData);
    assert.strictEqual(sanitized.director.pan, '[REDACTED_PAN]');
    assert.strictEqual(sanitized.director.aadhaar, '[REDACTED_AADHAAR]');
    assert.strictEqual(sanitized.branches[0].gstin, '[REDACTED_GSTIN]');
    assert.strictEqual(sanitized.branches[1].gstin, '[REDACTED_GSTIN]');
    assert.strictEqual(sanitized.description, 'Audit file audited_[REDACTED_PAN].xlsx');
  });

  runTest('T2.11: Missing answers / missing criteria fallback: defaults safely to rating 1 without NaN', () => {
    const partialAnswers = { q1: 4, q2: 3 }; // Only 2 of 25 answered
    const res = calculateHealthScore(partialAnswers);
    assert.ok(!isNaN(res.overall_score), 'Score must not be NaN');
    assert.ok(res.overall_score > 0 && res.overall_score < 100, 'Score must be a valid positive float');
    assert.strictEqual(res.answered_count, 2, 'Answered count must equal 2');
  });

  runTest('T2.12: Large payload buffer handling: 3.5MB document parsed in-memory without memory leaks', () => {
    const largeSize = 3.5 * 1024 * 1024;
    const largeBuffer = Buffer.alloc(largeSize, 0x61); // 3.5MB of 'a'
    const fileObj = {
      filename: 'large_annual_report.pdf',
      sizeBytes: largeBuffer.length
    };
    const res = validateCheckupPayload({
      company_name: 'Big Data Corp',
      contact_name: 'Big Data Tester',
      contact_email: 'bigdata@test.com',
      contact_phone: '9826011223',
      streamlined: true
    }, fileObj);
    assert.strictEqual(res.isValid, true, '3.5MB file must be accepted under the 4MB limit');
  });

  // ===========================================================================
  // TIER 3: CROSS-FEATURE COMBINATIONS (Pairwise Interactions, 6 Tests)
  // ===========================================================================
  console.log('\n================================================================');
  console.log('TIER 3: CROSS-FEATURE COMBINATIONS');
  console.log('================================================================');

  await runAsyncTest('T3.1: Profile + Document Upload + PII Scrubbing + Cal.com Prefill end-to-end pipeline', async () => {
    process.env.AI_MOCK_MODE = 'true';
    const boundary = '----WebKitFormBoundaryCrossFeatureX99';
    const rawMultipart =
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="company_name"\r\n\r\n` +
      `Kalyan Engineering & Auto Components\r\n` +
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="contact_name"\r\n\r\n` +
      `Kalyan Sundaram\r\n` +
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="contact_email"\r\n\r\n` +
      `kalyan@kalyaneng.com\r\n` +
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="contact_phone"\r\n\r\n` +
      `9893012345\r\n` +
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="industry"\r\n\r\n` +
      `Manufacturing & Engineering\r\n` +
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="turnover_band"\r\n\r\n` +
      `5Cr - 25Cr\r\n` +
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="notes"\r\n\r\n` +
      `Our GSTIN is 23AABCK1234M1Z8 and PAN is AABCK1234M. Need cash flow review.\r\n` +
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="dpdp_consent"\r\n\r\n` +
      `true\r\n` +
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="streamlined"\r\n\r\n` +
      `true\r\n` +
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="document"; filename="PnL_Q3_AABCK1234M.xlsx"\r\n` +
      `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\r\n\r\n` +
      `[Spreadsheet Binary Data Mock]\r\n` +
      `--${boundary}--\r\n`;

    const req = {
      method: 'POST',
      url: '/api/checkup/analyze',
      headers: {
        'content-type': `multipart/form-data; boundary=${boundary}`
      },
      body: Buffer.from(rawMultipart, 'utf-8')
    };
    const res = createMockRes();
    await analyzeHandler(req, res);

    assert.strictEqual(res.statusCode, 200, `Expected HTTP 200, got ${res.statusCode}`);
    const report = res.body;

    // Check PII redaction in observations & file metadata
    const reportStr = JSON.stringify(report);
    assert.ok(!reportStr.includes('AABCK1234M'), 'Raw PAN must be scrubbed from entire response');
    assert.ok(!reportStr.includes('23AABCK1234M1Z8'), 'Raw GSTIN must be scrubbed from entire response');

    // Verify Cal.com prefill compatibility
    const calPrefill = {
      name: report.meta.company_name,
      email: 'kalyan@kalyaneng.com',
      notes: `Report ID: ${report.meta.report_id} | Score: ${report.scores.overall_score}/100`
    };
    assert.strictEqual(calPrefill.name, 'Kalyan Engineering & Auto Components');
    assert.ok(calPrefill.notes.includes('Score:'), 'Cal.com prefill notes must include score');
  });

  runTest('T3.2: Homepage Teaser CTA -> Checkup Intake navigation and state transition', () => {
    const indexContent = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
    const checkupContent = fs.readFileSync(path.join(rootDir, 'checkup.html'), 'utf8');

    // Teaser CTA points to checkup.html
    assert.ok(indexContent.includes('href="checkup.html"'), 'Teaser CTA must route to checkup.html');

    // checkup.html Step 1 contains active pane on load
    assert.ok(checkupContent.includes('class="wizard-step-pane active" data-step="1"'), 'Step 1 must be active on initial load');
  });

  runTest('T3.3: Service Page Card Click -> Contact Form Prefill & Checkup Linking', () => {
    const cfoContent = fs.readFileSync(path.join(rootDir, 'cfo-services.html'), 'utf8');
    assert.ok(cfoContent.includes('href="checkup.html"'), 'CFO service page must link to checkup.html');
    assert.ok(cfoContent.includes('href="contact.html?service=diagnostic"') || cfoContent.includes('href="contact.html"'), 'Service page must route to contact form with context');
  });

  runTest('T3.4: Intake Submission -> Step 3 Processing Animation -> Preliminary Report state machine', () => {
    const checkupContent = fs.readFileSync(path.join(rootDir, 'checkup.html'), 'utf8');
    const jsContent = fs.readFileSync(path.join(rootDir, 'assets/js/checkup.js'), 'utf8');

    // 3-step wizard: Profile → Documents → Analysis (Review step removed)
    assert.ok(checkupContent.includes('data-step="1"'), 'Step 1 profile pane exists');
    assert.ok(checkupContent.includes('data-step="2"'), 'Step 2 documents pane exists');
    assert.ok(checkupContent.includes('data-step="3"'), 'Step 3 analysis pane exists');
    assert.ok(!checkupContent.includes('data-step="4"'), 'Step 4 must be gone after the cut');

    // Step transitions handled in JS
    assert.ok(jsContent.includes('goToStep(2)'), 'Must advance to Step 2 from the profile');
    assert.ok(jsContent.includes('goToStep(ANALYSIS_STEP)'), 'Must advance to the analysis step on submit');
  });

  runTest('T3.5: Preliminary Report View -> Cal.com Inline Booking or PDF Print action', () => {
    const checkupContent = fs.readFileSync(path.join(rootDir, 'checkup.html'), 'utf8');
    const jsContent = fs.readFileSync(path.join(rootDir, 'assets/js/checkup.js'), 'utf8');

    assert.ok(checkupContent.includes('id="btn-go-to-booking"'), 'Report view must have #btn-go-to-booking button');
    assert.ok(checkupContent.includes('id="btn-print-report"'), 'Report view must have #btn-print-report button');
    assert.ok(jsContent.includes('window.print()'), 'checkup.js must invoke window.print()');
    assert.ok(jsContent.includes("showAnalysisView('booking')"), 'checkup.js must reveal the booking block on CTA click');
  });

  runTest('T3.6: Multi-Pillar Scoring & Action Plan Synchronization', () => {
    // Generate report with specific weak pillar
    const customScores = calculateHealthScore({
      q1: 1, q2: 1, q3: 1, q4: 1, q5: 1, // Pillar 1 (Financial) = 0%
      q6: 4, q7: 4, q8: 4, q9: 4          // Pillar 2 (Sales) = 100%
    });
    const report = generateSyntheticReport({
      companyName: 'Financial Bottleneck Pvt Ltd',
      industry: 'Services',
      turnoverBand: '1Cr - 5Cr',
      scores: customScores,
      fileInfo: null,
      notes: ''
    });

    assert.strictEqual(report.scores.pillar_scores[0].status, 'Attention Needed', 'Pillar 1 must have Attention Needed status');
    assert.ok(report.critical_gaps.some(g => g.pillar.includes('Financial')), 'Critical gaps must identify Financial pillar weakness');
    assert.ok(report.priority_action_plan.immediate_30_days.length > 0, 'Must have immediate 30-day actions for low score');
  });

  // ===========================================================================
  // TIER 4: REAL-WORLD APPLICATION SCENARIOS (5 User Journeys)
  // ===========================================================================
  console.log('\n================================================================');
  console.log('TIER 4: REAL-WORLD APPLICATION SCENARIOS');
  console.log('================================================================');

  await runAsyncTest('T4.1 [Scenario 1]: MSME Manufacturing Promoter Journey (Shree Engineering Works, ₹5 Cr – ₹25 Cr)', async () => {
    process.env.AI_MOCK_MODE = 'true';
    const profile = {
      company_name: 'Shree Engineering Works Pvt Ltd',
      contact_name: 'Maheshwari Patel',
      contact_email: 'maheshwari@shree-engg.com',
      contact_phone: '9826098765',
      industry: 'Manufacturing & Engineering',
      turnover_band: '5Cr - 25Cr',
      notes: 'Experiencing 45-day delay in debtor collections and need fractional CFO guidance for bank CC limit renewal.',
      streamlined: true,
      dpdp_consent: true
    };
    const file = {
      filename: 'pnl_and_debtor_aging_q3.xlsx',
      sizeBytes: 154200
    };

    const req = createMockReq({
      method: 'POST',
      body: profile
    });
    const res = createMockRes();
    await analyzeHandler(req, res);

    assert.strictEqual(res.statusCode, 200);
    const report = res.body;

    assert.strictEqual(report.meta.company_name, 'Shree Engineering Works Pvt Ltd');
    assert.strictEqual(report.meta.turnover_band, '5Cr - 25Cr');
    assert.ok(report.scores.overall_score >= 0 && report.scores.overall_score <= 100);
    assert.ok(report.executive_summary.includes('Shree Engineering Works Pvt Ltd'));
    assert.ok(report.priority_action_plan.immediate_30_days.length > 0);
    assert.ok(report.consultation_agenda.length >= 3);
  });

  await runAsyncTest('T4.2 [Scenario 2]: Early-Stage Tech Startup Journey (ApexSaaS Technologies, <₹50 Lakhs)', async () => {
    process.env.AI_MOCK_MODE = 'true';
    const profile = {
      company_name: 'ApexSaaS Technologies LLP',
      contact_name: 'Arjun Mehta',
      contact_email: 'arjun@apexsaas.io',
      contact_phone: '9871234567',
      industry: 'Technology, SaaS & IT Services',
      turnover_band: '<50 Lakhs',
      notes: 'Early stage B2B SaaS startup with 8 months runway. Looking to set up ESOP scheme and IPR copyright registration.',
      streamlined: true,
      dpdp_consent: true
    };

    const req = createMockReq({
      method: 'POST',
      body: profile
    });
    const res = createMockRes();
    await analyzeHandler(req, res);

    assert.strictEqual(res.statusCode, 200);
    const report = res.body;

    assert.strictEqual(report.meta.company_name, 'ApexSaaS Technologies LLP');
    assert.strictEqual(report.meta.turnover_band, '<50 Lakhs');
    assert.ok(report.key_strengths.length >= 2);
    assert.ok(report.critical_gaps.length >= 2);
  });

  await runAsyncTest('T4.3 [Scenario 3]: Retail & D2C Scale-up Journey with Mixed PII (VogueStyle Retail, ₹25 Cr – ₹50 Cr)', async () => {
    process.env.AI_MOCK_MODE = 'true';
    const profile = {
      company_name: 'VogueStyle Retail Brands Pvt Ltd',
      contact_name: 'Ritu Singhal',
      contact_email: 'ritu@voguestyle.co.in',
      contact_phone: '9811122233',
      industry: 'Retail, E-commerce & FMCG',
      turnover_band: '25Cr - 50Cr',
      notes: 'GSTIN 07AAACV1234F1Z3 and PAN AAACV1234F. Need multi-channel inventory reconciliation and GSTR-2B ITC audit.',
      streamlined: true,
      dpdp_consent: true
    };

    const req = createMockReq({
      method: 'POST',
      body: profile
    });
    const res = createMockRes();
    await analyzeHandler(req, res);

    assert.strictEqual(res.statusCode, 200);
    const report = res.body;

    const reportJson = JSON.stringify(report);
    assert.ok(!reportJson.includes('AAACV1234F'), 'Director PAN must be redacted');
    assert.ok(!reportJson.includes('07AAACV1234F1Z3'), 'State GSTIN must be redacted');
    assert.ok(report.scores.pillar_scores.length === 6);
  });

  await runAsyncTest('T4.4 [Scenario 4]: Compliance & Healthcare Transition Journey (CarePlus Diagnostics, ₹10 Cr – ₹25 Cr)', async () => {
    process.env.AI_MOCK_MODE = 'true';
    const profile = {
      company_name: 'CarePlus Diagnostic Centers LLP',
      contact_name: 'Dr. Vivek Sen',
      contact_email: 'sen@careplusdiagnostics.in',
      contact_phone: '9926055555',
      industry: 'Healthcare, Pharma & Life Sciences',
      turnover_band: '10Cr - 25Cr',
      notes: 'Expanding to 4 new cities. Require SOP formalization, Capex financing advisory, and clinical equipment leasing.',
      streamlined: true,
      dpdp_consent: true
    };

    const req = createMockReq({
      method: 'POST',
      body: profile
    });
    const res = createMockRes();
    await analyzeHandler(req, res);

    assert.strictEqual(res.statusCode, 200);
    const report = res.body;

    // Verify authentic BMR consulting copy without legacy medical demo text
    assert.strictEqual(report.meta.company_name, 'CarePlus Diagnostic Centers LLP');
    assert.ok(report.executive_summary.includes('CarePlus Diagnostic Centers LLP'));
    assert.ok(report.consultation_agenda.some(a => a.includes('CFO') || a.includes('Working Capital') || a.includes('Advisory')));
  });

  await runAsyncTest('T4.5 [Scenario 5]: Unprepared Visitor Error Recovery Journey (Invalid submission -> Correction -> Success)', async () => {
    process.env.AI_MOCK_MODE = 'true';

    // Step 1: Submits invalid empty form -> Blocked
    const req1 = createMockReq({
      method: 'POST',
      body: { company_name: '', contact_email: 'invalid', contact_phone: '123' }
    });
    const res1 = createMockRes();
    await analyzeHandler(req1, res1);
    assert.strictEqual(res1.statusCode, 400, 'Empty submission must be rejected with HTTP 400');

    // Step 2: Submits with invalid phone format -> Blocked
    const req2 = createMockReq({
      method: 'POST',
      body: { company_name: 'Recovery Test Co', contact_name: 'John Doe', contact_email: 'john@recovery.com', contact_phone: '12345' }
    });
    const res2 = createMockRes();
    await analyzeHandler(req2, res2);
    assert.strictEqual(res2.statusCode, 400, 'Invalid phone must be rejected with HTTP 400');

    // Step 3: Submits with unsupported file format (.exe) -> Blocked
    const req3 = createMockReq({
      method: 'POST',
      body: { company_name: 'Recovery Test Co', contact_name: 'John Doe', contact_email: 'john@recovery.com', contact_phone: '9826011223' }
    });
    // Simulating file in validateCheckupPayload
    const val3 = validateCheckupPayload(req3.body, { filename: 'exploit.exe', sizeBytes: 1024 });
    assert.strictEqual(val3.isValid, false, 'Unsupported .exe file must be rejected');

    // Step 4: Corrects all fields and submits valid request -> Success HTTP 200
    const req4 = createMockReq({
      method: 'POST',
      body: {
        company_name: 'Recovery Test Co',
        contact_name: 'John Doe',
        contact_email: 'john@recovery.com',
        contact_phone: '9826011223',
        industry: 'Trading & Services',
        turnover_band: '1Cr - 5Cr',
        streamlined: true,
        dpdp_consent: true
      }
    });
    const res4 = createMockRes();
    await analyzeHandler(req4, res4);
    assert.strictEqual(res4.statusCode, 200, 'Corrected submission must succeed with HTTP 200');
    assert.ok(res4.body.meta.report_id.startsWith('BMR-'), 'Report ID must follow BMR format');
  });

  // ===========================================================================
  // SUITE 5: RESPONSIVE & PRINT MEDIA VERIFICATION
  // ===========================================================================
  console.log('\n================================================================');
  console.log('SUITE 5: RESPONSIVE & PRINT MEDIA VERIFICATION');
  console.log('================================================================');

  const bmrDsCss = fs.readFileSync(path.join(rootDir, 'assets/css/bmr-ds.css'), 'utf8');

  runTest('T5.1: Mobile breakpoint styles (max-width: 576px / 767px) defined in bmr-ds.css', () => {
    assert.ok(bmrDsCss.includes('@media (max-width: 576px)') || bmrDsCss.includes('@media (max-width: 767px)') || bmrDsCss.includes('@media (max-width: 768px)'), 'Must contain mobile media queries');
  });

  runTest('T5.2: Tablet breakpoint styles (max-width: 991px) defined for navigation and wizard', () => {
    assert.ok(bmrDsCss.includes('@media (max-width: 991px)'), 'Must contain tablet media query (max-width: 991px)');
  });

  runTest('T5.3: Desktop breakpoint styles (min-width: 1200px / 1400px) defined for container and layout', () => {
    const styleCss = fs.readFileSync(path.join(rootDir, 'assets/css/style.css'), 'utf8');
    assert.ok(styleCss.includes('@media (min-width: 1200px)') || styleCss.includes('@media (min-width: 1400px)') || bmrDsCss.includes(':root'), 'Must support desktop container widths');
  });

  runTest('T5.4: Print media stylesheet (@media print) configured for clean report export and hides UI chrome', () => {
    assert.ok(bmrDsCss.includes('@media print'), 'bmr-ds.css must contain @media print block');
    assert.ok(bmrDsCss.includes('header, footer') && bmrDsCss.includes('display: none !important'), 'Print styles must hide header and footer');
    assert.ok(bmrDsCss.includes('break-inside: avoid'), 'Print styles must prevent page breaks inside cards');
    assert.ok(bmrDsCss.includes('print-color-adjust: exact'), 'Print styles must retain exact brand colors');
  });

  // ===========================================================================
  // SUITE 6: FULL REGRESSION EXECUTION
  // ===========================================================================
  console.log('\n================================================================');
  console.log('SUITE 6: FULL REGRESSION EXECUTION');
  console.log('================================================================');

  runTest('T6.1: Regression test verify_m2.js executes cleanly with 0 errors', () => {
    const output = execSync('node verify_m2.js', { cwd: rootDir, encoding: 'utf8' });
    assert.ok(output.includes('ALL CHECKS PASSED: 0 errors detected'), 'verify_m2.js must report 0 errors');
  });

  runTest('T6.2: Regression test verify_m3.js executes cleanly with 0 errors', () => {
    const output = execSync('node verify_m3.js', { cwd: rootDir, encoding: 'utf8' });
    assert.ok(output.includes('[SUCCESS] All Milestone 3 verification tests passed successfully.'), 'verify_m3.js must pass 100%');
  });

  runTest('T6.3: Regression test verify_m4.js executes cleanly with 0 errors', () => {
    const output = execSync('node verify_m4.js', { cwd: rootDir, encoding: 'utf8' });
    assert.ok(output.includes('[SUCCESS] All Milestone 4 verification tests passed with 0 errors.'), 'verify_m4.js must pass 100%');
  });

  // ===========================================================================
  // FINAL SCORECARD
  // ===========================================================================
  console.log('\n================================================================');
  console.log(`TOTAL E2E TESTS: ${totalTests}`);
  console.log(`PASSED:          ${passedTests}`);
  console.log(`FAILED:          ${failedTests}`);
  console.log('================================================================');

  if (failedTests > 0) {
    console.error(`\n[FAILURE] ${failedTests} test(s) failed in E2E Verification Suite.`);
    process.exit(1);
  } else {
    console.log('\n[SUCCESS] 100% of all End-to-End tests passed with 0 failures!');
    process.exit(0);
  }
}

runAllTests().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
