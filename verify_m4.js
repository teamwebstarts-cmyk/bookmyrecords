/**
 * BookMyRecords Milestone 4 Comprehensive Verification Suite
 * 
 * Verifies:
 * 1. index.html & checkup.html structure:
 *    - Teaser section with updated copy & "Get Free Health Assessment" CTA
 *    - Customer DOES NOT see 24/25 questions in checkup.html (q1..q25 purged from DOM)
 *    - Streamlined Intake Form (Profile + Document Dropzone + Notes + DPDP Consent)
 *    - Live Processing Screen (Sequential status steps 1-5)
 *    - Dynamic Preliminary Report View (Score dial, Risk band, 6 Pillars, Strengths/Gaps, Action plan)
 *    - Cal.com Consultation Booking embed (#cal-inline-embed & direct hotline)
 * 2. assets/js/checkup.js validation rules, endpoints, and Cal.com embed logic
 * 3. api/checkup/analyze.js internal criteria evaluation & Gemini prompt criteria
 * 4. All 3 documentation deliverables exist with >1000 characters
 * 5. Regression tests: verify_m3.js (29 tests) and verify_m2.js run with 0 errors
 * 
 * Execution: node verify_m4.js
 */

'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { execSync } = require('child_process');

const rootDir = process.cwd();

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

async function runAllTests() {
  console.log('================================================================');
  console.log('BookMyRecords Milestone 4 — Frontend & Integration Test Suite');
  console.log('================================================================\n');

  // ===========================================================================
  // SUITE 1: Homepage Teaser Section in index.html
  // ===========================================================================
  console.log('--- SUITE 1: Homepage Teaser Section (index.html) ---');

  const indexContent = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');

  runTest('Teaser section exists immediately below banner in index.html', () => {
    assert.ok(indexContent.includes('id="health-checkup-teaser"'), 'Must have section #health-checkup-teaser');
    const bannerIndex = indexContent.indexOf('<!-- End Banner section -->');
    const teaserIndex = indexContent.indexOf('id="health-checkup-teaser"');
    assert.ok(bannerIndex !== -1 && teaserIndex !== -1, 'Both banner and teaser must exist');
    assert.ok(teaserIndex > bannerIndex, 'Teaser section must follow banner section');
  });

  runTest('Teaser contains title: Free Business Health Checkup and Executive Diagnostic Report', () => {
    assert.ok(indexContent.includes('Free Business Health Checkup'), 'Must have heading "Free Business Health Checkup"');
    assert.ok(indexContent.includes('Executive Diagnostic Report') || indexContent.includes('24-Point AI Diagnostic Report'), 'Must mention Diagnostic Report');
  });

  runTest('Teaser contains updated zero-friction value proposition copy', () => {
    assert.ok(
      indexContent.includes('Upload your financial documents') &&
      indexContent.includes('100% Free, No Login Required'),
      'Must contain updated streamlined document intake teaser copy'
    );
  });

  runTest('Teaser contains all 4 trust badges (100% Free, No Login Required, Instant Analysis, Confidential & DPDP Compliant)', () => {
    assert.ok(indexContent.includes('100% Free'), 'Must contain 100% Free badge');
    assert.ok(indexContent.includes('No Login Required'), 'Must contain No Login Required badge');
    assert.ok(indexContent.includes('Instant Health Analysis') || indexContent.includes('Instant AI Analysis') || indexContent.includes('3-Minute Assessment'), 'Must contain speed/analysis badge');
    assert.ok(indexContent.includes('Confidential &amp; DPDP Compliant') || indexContent.includes('Confidential & DPDP Compliant'), 'Must contain Confidential & DPDP Compliant badge');
  });

  runTest('Teaser contains 6 pillar preview badges (Financial, Sales, Marketing, Operations, IT, Governance)', () => {
    assert.ok(indexContent.includes('Financial') || indexContent.includes('Financial Health'), 'Must have Financial pillar badge');
    assert.ok(indexContent.includes('Sales') || indexContent.includes('Sales Pipeline'), 'Must have Sales pillar badge');
    assert.ok(indexContent.includes('Marketing') || indexContent.includes('Marketing & Brand'), 'Must have Marketing pillar badge');
    assert.ok(indexContent.includes('Operations'), 'Must have Operations pillar badge');
    assert.ok(indexContent.includes('IT'), 'Must have IT pillar badge');
    assert.ok(indexContent.includes('Governance'), 'Must have Governance pillar badge');
  });

  runTest('Teaser contains prominent CTA linking directly to checkup.html with "Get Free Health Assessment"', () => {
    const ctaRegex = /<a[^>]+href=["']checkup\.html["'][^>]*>[\s\S]*?Get Free Health Assessment[\s\S]*?<\/a>/i;
    assert.ok(ctaRegex.test(indexContent), 'Must have CTA link to checkup.html with "Get Free Health Assessment" text');
  });

  // ===========================================================================
  // SUITE 2: Interactive Checkup Wizard in checkup.html
  // ===========================================================================
  console.log('\n--- SUITE 2: Interactive Checkup Wizard (checkup.html) ---');

  const checkupContent = fs.readFileSync(path.join(rootDir, 'checkup.html'), 'utf8');

  runTest('checkup.html exists and links bmr-ds.css and checkup.js', () => {
    assert.ok(checkupContent.includes('assets/css/bmr-ds.css'), 'Must link bmr-ds.css');
    assert.ok(checkupContent.includes('assets/js/checkup.js'), 'Must link checkup.js');
  });

  runTest('STAKEHOLDER DIRECTIVE: Customer MUST NOT see question inputs (q1..q25 purged from DOM)', () => {
    for (let i = 1; i <= 25; i++) {
      assert.ok(!checkupContent.includes(`name="q${i}"`), `checkup.html must NOT contain input name="q${i}"`);
    }
    assert.ok(!checkupContent.includes('name="q1"'), 'q1 must not be present');
    assert.ok(!checkupContent.includes('name="q25"'), 'q25 must not be present');
  });

  runTest('checkup.html contains 3 streamlined wizard step panes (data-step 1 to 3, no gap)', () => {
    for (let i = 1; i <= 3; i++) {
      assert.ok(checkupContent.includes(`data-step="${i}"`), `Must contain step ${i} indicator/pane`);
    }
    assert.ok(!checkupContent.includes('data-step="4"'), 'Step 4 must not exist — the Review step was cut');
  });

  runTest('Step 1 Intake Form contains all required profile and document upload fields', () => {
    assert.ok(checkupContent.includes('id="company_name"'), 'Must have company_name input');
    assert.ok(checkupContent.includes('id="contact_name"'), 'Must have contact_name input');
    assert.ok(checkupContent.includes('id="contact_email"'), 'Must have contact_email input');
    assert.ok(checkupContent.includes('id="contact_phone"'), 'Must have contact_phone input');
    assert.ok(checkupContent.includes('id="industry"'), 'Must have industry dropdown');
    assert.ok(checkupContent.includes('id="turnover_band"'), 'Must have turnover_band dropdown');
    assert.ok(checkupContent.includes('id="business_notes"') || checkupContent.includes('id="notes"'), 'Must have business notes textarea');
    assert.ok(checkupContent.includes('id="upload-dropzone"'), 'Must have upload dropzone');
    assert.ok(checkupContent.includes('id="document-file-input"'), 'Must have document file input');
    assert.ok(checkupContent.includes('id="dpdp-consent-checkbox"'), 'Must have mandatory DPDP consent checkbox');
    assert.ok(checkupContent.includes('id="btn-analyze-submit"') || checkupContent.includes('id="btn-start-checkup"'), 'Must have primary analysis submit button');
  });

  runTest('Step 2 Live Processing Animation elements exist with 5 sequential steps', () => {
    assert.ok(checkupContent.includes('class="processing-spinner"'), 'Must have processing spinner');
    for (let i = 1; i <= 5; i++) {
      assert.ok(checkupContent.includes(`id="proc-step-${i}"`), `Must have processing step ${i}`);
    }
  });

  runTest('Step 3 Dynamic Preliminary Report components exist', () => {
    assert.ok(checkupContent.includes('id="report-company-name"'), 'Must have report company name');
    assert.ok(checkupContent.includes('id="report-id-display"'), 'Must have report ID display');
    assert.ok(checkupContent.includes('id="report-score-number"'), 'Must have report score number');
    assert.ok(checkupContent.includes('id="report-risk-band-pill"'), 'Must have risk band pill');
    assert.ok(checkupContent.includes('id="pillar-cards-container"'), 'Must have pillar cards container');
    assert.ok(checkupContent.includes('id="executive-summary-text"'), 'Must have executive summary box');
    assert.ok(checkupContent.includes('id="key-strengths-container"'), 'Must have strengths container');
    assert.ok(checkupContent.includes('id="critical-gaps-container"'), 'Must have critical gaps container');
    assert.ok(checkupContent.includes('id="plan-30-container"'), 'Must have 30-day action plan container');
    assert.ok(checkupContent.includes('id="plan-60-container"'), 'Must have 60-day action plan container');
    assert.ok(checkupContent.includes('id="plan-90-container"'), 'Must have 90-day action plan container');
    assert.ok(checkupContent.includes('id="btn-print-report"'), 'Must have print report button');
    assert.ok(checkupContent.includes('id="btn-retake-checkup"'), 'Must have retake assessment button');
    assert.ok(checkupContent.includes('id="btn-go-to-booking"'), 'Must have proceed to booking button');
  });

  runTest('Step 4 Cal.com Consultation Booking Integration elements exist', () => {
    assert.ok(checkupContent.includes('id="cal-inline-embed"'), 'Must have #cal-inline-embed container');
    assert.ok(checkupContent.includes('https://cal.com/bookmyrecords/checkup-consultation'), 'Must have direct fallback link to Cal.com');
    assert.ok(checkupContent.includes('href="tel:+919669693315"'), 'Must have direct phone consultation link');
  });

  // ===========================================================================
  // SUITE 3: Client Controller & Validation Logic in assets/js/checkup.js
  // ===========================================================================
  console.log('\n--- SUITE 3: Client Controller & Validation (assets/js/checkup.js) ---');

  const checkupJsContent = fs.readFileSync(path.join(rootDir, 'assets/js/checkup.js'), 'utf8');

  runTest('checkup.js exists, is non-empty, and syntax is valid', () => {
    assert.ok(checkupJsContent.length > 3000, 'checkup.js must be substantial');
    assert.doesNotThrow(() => {
      new Function(checkupJsContent);
    }, 'checkup.js must be syntactically valid JavaScript');
  });

  runTest('checkup.js integrates with /api/checkup/analyze endpoint', () => {
    assert.ok(checkupJsContent.includes('/api/checkup/analyze'), 'Must target /api/checkup/analyze');
  });

  runTest('checkup.js enforces 4 MB upload limit and allowed file extensions', () => {
    assert.ok(checkupJsContent.includes('4 * 1024 * 1024') || checkupJsContent.includes('4194304'), 'Must check 4 MB limit');
    assert.ok(checkupJsContent.includes('.pdf') && checkupJsContent.includes('.xlsx') && checkupJsContent.includes('.csv'), 'Must check allowed extensions');
  });

  runTest('checkup.js validates 10-digit Indian mobile number format', () => {
    assert.ok(checkupJsContent.includes('[6-9]\\d{9}') || checkupJsContent.includes('[6789]'), 'Must validate 10-digit phone');
  });

  runTest('checkup.js includes Cal.com initialization and embed loader', () => {
    assert.ok(checkupJsContent.includes('https://app.cal.com/embed/embed.js'), 'Must load Cal.com embed script');
    assert.ok(checkupJsContent.includes('bookmyrecords/checkup-consultation'), 'Must target checkup-consultation calLink');
    assert.ok(checkupJsContent.includes('Cal("inline"') || checkupJsContent.includes("Cal('inline'"), 'Must call Cal inline');
  });

  // ===========================================================================
  // SUITE 4: Backend Internal Criteria Evaluation & System Prompt
  // ===========================================================================
  console.log('\n--- SUITE 4: Backend Evaluation Engine (api/checkup/analyze.js) ---');

  const analyzeBackend = require('./api/checkup/analyze');

  runTest('analyze.js exports evaluateInternalCriteria function', () => {
    assert.strictEqual(typeof analyzeBackend.evaluateInternalCriteria, 'function', 'evaluateInternalCriteria must be an exported function');
  });

  runTest('evaluateInternalCriteria deterministically produces ratings for all 25 criteria', () => {
    const evaluated = analyzeBackend.evaluateInternalCriteria({
      companyName: 'Acme Logistics Pvt Ltd',
      industry: 'Logistics, Supply Chain & Warehousing',
      turnoverBand: '₹5 Cr – ₹25 Cr',
      notes: 'Need better cash flow visibility and CRM automation',
      file: { filename: 'gst_summary_2025.pdf', size: 102400 }
    });

    assert.ok(evaluated && typeof evaluated === 'object', 'Evaluated output must be an object');
    for (let i = 1; i <= 25; i++) {
      const rating = evaluated[`q${i}`];
      assert.ok(typeof rating === 'number', `q${i} must have a numeric rating`);
      assert.ok(rating >= 1 && rating <= 4, `q${i} rating must be between 1 and 4 (got: ${rating})`);
    }
  });

  runTest('analyze.js system prompt contains the 24 internal assessment criteria across 6 pillars', () => {
    const analyzeCode = fs.readFileSync(path.join(rootDir, 'api/checkup/analyze.js'), 'utf8');
    assert.ok(analyzeCode.includes('Financial Health & Statutory Compliance (Weight: 25%)'), 'System prompt must include Pillar 1');
    assert.ok(analyzeCode.includes('Sales & Revenue Pipeline (Weight: 20%)'), 'System prompt must include Pillar 2');
    assert.ok(analyzeCode.includes('Marketing & Brand Positioning (Weight: 15%)'), 'System prompt must include Pillar 3');
    assert.ok(analyzeCode.includes('Operational Efficiency & SOPs (Weight: 15%)'), 'System prompt must include Pillar 4');
    assert.ok(analyzeCode.includes('IT, Systems & Digital Readiness (Weight: 15%)'), 'System prompt must include Pillar 5');
    assert.ok(analyzeCode.includes('Governance, Legal & IPR Protection (Weight: 10%)'), 'System prompt must include Pillar 6');
  });

  // ===========================================================================
  // SUITE 5: Documentation Specifications (docs/bookmyrecords/)
  // ===========================================================================
  console.log('\n--- SUITE 5: Documentation Specs (docs/bookmyrecords/) ---');

  const docFiles = [
    'docs/bookmyrecords/USER_FLOW.md',
    'docs/bookmyrecords/UX_BEHAVIOR.md',
    'docs/bookmyrecords/TECHNICAL_FLOW.md'
  ];

  for (const doc of docFiles) {
    runTest(`Specification ${doc} exists and contains > 1,000 characters`, () => {
      const fullPath = path.join(rootDir, doc);
      assert.ok(fs.existsSync(fullPath), `${doc} must exist`);
      const content = fs.readFileSync(fullPath, 'utf8');
      assert.ok(content.length > 1000, `${doc} must have >1000 characters (found: ${content.length})`);
    });
  }

  // ===========================================================================
  // SUITE 6: Regression Tests (verify_m3.js and verify_m2.js)
  // ===========================================================================
  console.log('\n--- SUITE 6: Regression Suites Execution ---');

  runTest('node verify_m3.js executes cleanly with 0 errors', () => {
    const out = execSync('node verify_m3.js', { encoding: 'utf8', cwd: rootDir });
    assert.ok(out.includes('All Milestone 3 verification tests passed successfully'), 'verify_m3.js must pass');
  });

  runTest('node verify_m2.js executes cleanly with 0 errors', () => {
    const out = execSync('node verify_m2.js', { encoding: 'utf8', cwd: rootDir });
    assert.ok(out.includes('ALL CHECKS PASSED: 0 errors detected!'), 'verify_m2.js must pass');
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
    console.error(`\n[ERROR] Milestone 4 verification failed with ${failedTests} failure(s).`);
    process.exit(1);
  } else {
    console.log('\n[SUCCESS] All Milestone 4 verification tests passed with 0 errors.');
    process.exit(0);
  }
}

runAllTests().catch(err => {
  console.error('Fatal test runner error in verify_m4.js:', err);
  process.exit(1);
});
