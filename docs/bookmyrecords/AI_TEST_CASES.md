# BookMyRecords — Synthetic AI Test Cases Specification
**Document Code**: BMR-QA-TESTCASES-2026-V1  
**Status**: Approved Test Suite  
**Effective Date**: November 2026  
**Target Coverage**: Scoring Determinism, Schema Validation, PII Scrubbing, Boundary Scores, and Fault Tolerance  

---

## 1. Overview & Test Suite Objectives

This document defines 12 synthetic test cases used to validate the BookMyRecords Business Health Assessment Engine across `api/checkup/score.js`, `api/checkup/analyze.js`, and `api/checkup/health.js`.

Testing adheres to four non-negotiable architectural mandates:
1. **Mathematical Determinism**: Given identical questionnaire inputs, the calculated score and pillar breakdowns must produce identical numerical outputs.
2. **Schema Adherence**: All report outputs must conform 100% to the draft-07 JSON schema defined in `AI_REPORT_DESIGN.md`.
3. **Statutory PII Shielding**: Identifiable Indian corporate and individual tax identifiers (PAN, Aadhaar, GSTIN, Bank Accounts, Cards) must be scrubbed before prompt assembly.
4. **Resilient Failure Recovery**: In the absence of live external API keys, during network timeouts, or on malformed inputs, the system must never crash and must return clean, typed HTTP responses.

---

## 2. Test Case Catalog

### Test Case 1: High-Performing Manufacturing Enterprise
- **Profile**:
  - `company_name`: `"Kalyan Heavy Engineering Pvt Ltd"`
  - `contact_name`: `"Vikramaditya Shinde"`
  - `contact_email`: `"vikram@kalyanengineering.com"`
  - `contact_phone`: `"9826011223"`
  - `industry`: `"Precision Auto Components Manufacturing"`
  - `turnover_band`: `"10Cr - 25Cr"`
- **Assessment Ratings**:
  - Pillar 1 (Financials): `[q1: 4, q2: 4, q3: 4, q4: 4, q5: 3]` (Score: 23.33 / 25, 93.3%)
  - Pillar 2 (Sales): `[q6: 4, q7: 4, q8: 3, q9: 4]` (Score: 18.33 / 20, 91.7%)
  - Pillar 3 (Marketing): `[q10: 3, q11: 3, q12: 4, q13: 3]` (Score: 11.25 / 15, 75.0%)
  - Pillar 4 (Operations): `[q14: 4, q15: 4, q16: 3, q17: 4]` (Score: 13.75 / 15, 91.7%)
  - Pillar 5 (IT): `[q18: 4, q19: 4, q20: 3, q21: 4]` (Score: 13.75 / 15, 91.7%)
  - Pillar 6 (Governance): `[q22: 4, q23: 4, q24: 3, q25: 4]` (Score: 9.17 / 10, 91.7%)
- **Expected Numerical Result**:
  - `overall_score`: `89.6`
  - `risk_band`: `"Strong"`
  - Pillar Statuses: Financials: `"Good"`, Sales: `"Good"`, Marketing: `"Average"`, Operations: `"Good"`, IT: `"Good"`, Governance: `"Good"`
- **Expected Report Narrative**: Focus on institutional expansion, debt syndication, and digital marketing maturity.

---

### Test Case 2: Distressed Retail Enterprise with Working Capital Strain
- **Profile**:
  - `company_name`: `"Shree Balaji Consumer Retailers"`
  - `contact_name`: `"Ramesh Agarwal"`
  - `contact_email`: `"balaji.retail.indore@gmail.com"`
  - `contact_phone`: `"9425098765"`
  - `industry`: `"FMCG & Multi-Brand Consumer Retail"`
  - `turnover_band`: `"1Cr - 5Cr"`
- **Assessment Ratings**:
  - Pillar 1 (Financials): `[q1: 1, q2: 1, q3: 2, q4: 1, q5: 1]` (Score: 1.67 / 25, 6.7%)
  - Pillar 2 (Sales): `[q6: 2, q7: 1, q8: 1, q9: 2]` (Score: 3.33 / 20, 16.7%)
  - Pillar 3 (Marketing): `[q10: 1, q11: 1, q12: 2, q13: 1]` (Score: 1.25 / 15, 8.3%)
  - Pillar 4 (Operations): `[q14: 1, q15: 1, q16: 2, q17: 1]` (Score: 1.25 / 15, 8.3%)
  - Pillar 5 (IT): `[q18: 2, q19: 1, q20: 1, q21: 1]` (Score: 1.25 / 15, 8.3%)
  - Pillar 6 (Governance): `[q22: 2, q23: 1, q24: 1, q25: 1]` (Score: 0.83 / 10, 8.3%)
- **Expected Numerical Result**:
  - `overall_score`: `10.6`
  - `risk_band`: `"Critical"`
  - All 6 Pillar Statuses: `"Attention Needed"`
- **Expected Report Narrative**: Immediate emergency cash-flow stabilization, reconciliation of overdue GST/TDS liabilities, and restructuring debtor collection cycles.

---

### Test Case 3: Scaling Tech Services Firm with IPR & Contract Gaps
- **Profile**:
  - `company_name`: `"CloudMatrix Innovations LLP"`
  - `contact_name`: `"Sneha Nambiar"`
  - `contact_email`: `"sneha@cloudmatrix.dev"`
  - `contact_phone`: `"9711234567"`
  - `industry`: `"SaaS & Cloud Consulting Services"`
  - `turnover_band`: `"5Cr - 10Cr"`
- **Assessment Ratings**:
  - Pillar 1 (Financials): `[q1: 4, q2: 3, q3: 3, q4: 4, q5: 3]` (Score: 20.00 / 25, 80.0%)
  - Pillar 2 (Sales): `[q6: 3, q7: 4, q8: 3, q9: 3]` (Score: 15.00 / 20, 75.0%)
  - Pillar 3 (Marketing): `[q10: 4, q11: 3, q12: 4, q13: 3]` (Score: 12.50 / 15, 83.3%)
  - Pillar 4 (Operations): `[q14: 3, q15: 3, q16: 3, q17: 3]` (Score: 10.00 / 15, 66.7%)
  - Pillar 5 (IT): `[q18: 4, q19: 4, q20: 4, q21: 4]` (Score: 15.00 / 15, 100.0%)
  - Pillar 6 (Governance): `[q22: 2, q23: 1, q24: 2, q25: 2]` (Score: 2.50 / 10, 25.0%)
- **Expected Numerical Result**:
  - `overall_score`: `75.0`
  - `risk_band`: `"Moderate"`
  - Pillar Statuses: IT: `"Good"`, Marketing: `"Good"`, Financials: `"Good"`, Sales: `"Average"`, Operations: `"Average"`, Governance: `"Attention Needed"`
- **Expected Report Narrative**: Highlight strong digital infrastructure and healthy sales, while flagging urgent need for trademark registrations, formal IP assignments, and client MSAs.

---

### Test Case 4: Traditional Family-Owned Trading Firm with Key Person Dependency
- **Profile**:
  - `company_name`: `"Malwa Agro Commodities Traders"`
  - `contact_name`: `"Jagdish Patel"`
  - `contact_email`: `"jagdish.malwa@rediffmail.com"`
  - `contact_phone`: `"9827033445"`
  - `industry`: `"Wholesale Grain & Agricultural Trading"`
  - `turnover_band`: `"10Cr - 25Cr"`
- **Assessment Ratings**:
  - Pillar 1 (Financials): `[q1: 2, q2: 3, q3: 3, q4: 2, q5: 2]` (Score: 11.67 / 25, 46.7%)
  - Pillar 2 (Sales): `[q6: 2, q7: 2, q8: 2, q9: 4]` (Score: 10.00 / 20, 50.0%)
  - Pillar 3 (Marketing): `[q10: 1, q11: 1, q12: 2, q13: 1]` (Score: 1.25 / 15, 8.3%)
  - Pillar 4 (Operations): `[q14: 2, q15: 1, q16: 3, q17: 2]` (Score: 6.25 / 15, 41.7%)
  - Pillar 5 (IT): `[q18: 2, q19: 2, q20: 2, q21: 1]` (Score: 3.75 / 15, 25.0%)
  - Pillar 6 (Governance): `[q22: 3, q23: 2, q24: 2, q25: 2]` (Score: 4.17 / 10, 41.7%)
- **Expected Numerical Result**:
  - `overall_score`: `37.1`
  - `risk_band`: `"Critical"`
  - Pillar Statuses: Sales: `"Average"`, all others: `"Attention Needed"`
- **Expected Report Narrative**: Address founder fatigue, lack of delegation matrix, absence of digital accounting backups, and vulnerable informal agreements with mandi brokers.

---

### Test Case 5: Infrastructure & EPC Contractor with ITC Reconciliations
- **Profile**:
  - `company_name`: `"Narmada Infra Buildcon Pvt Ltd"`
  - `contact_name`: `"Harishankar Tiwari"`
  - `contact_email`: `"tiwari@narmadainfra.in"`
  - `contact_phone`: `"9425211990"`
  - `industry`: `"Civil Construction & EPC Contracting"`
  - `turnover_band`: `"25Cr - 50Cr"`
- **Assessment Ratings**:
  - Pillar 1 (Financials): `[q1: 3, q2: 2, q3: 2, q4: 3, q5: 2]` (Score: 11.67 / 25, 46.7%)
  - Pillar 2 (Sales): `[q6: 2, q7: 3, q8: 2, q9: 3]` (Score: 10.00 / 20, 50.0%)
  - Pillar 3 (Marketing): `[q10: 2, q11: 2, q12: 3, q13: 2]` (Score: 6.25 / 15, 41.7%)
  - Pillar 4 (Operations): `[q14: 3, q15: 2, q16: 2, q17: 3]` (Score: 7.50 / 15, 50.0%)
  - Pillar 5 (IT): `[q18: 3, q19: 3, q20: 2, q21: 2]` (Score: 7.50 / 15, 50.0%)
  - Pillar 6 (Governance): `[q22: 4, q23: 2, q24: 3, q25: 3]` (Score: 6.67 / 10, 66.7%)
- **Expected Numerical Result**:
  - `overall_score`: `49.6`
  - `risk_band`: `"Vulnerable"`
  - Pillar Statuses: Financials: `"Attention Needed"`, Marketing: `"Attention Needed"`, Sales: `"Average"`, Operations: `"Average"`, IT: `"Average"`, Governance: `"Average"`
- **Expected Report Narrative**: Highlight subcontracting GST compliance, working capital blockage due to government retention money, and GSTR-2B ITC reconciliation risks.

---

### Test Case 6: Healthcare & Diagnostics Provider
- **Profile**:
  - `company_name`: `"CityLife Diagnostic & Wellness Labs"`
  - `contact_name`: `"Dr. Ananya Joshi"`
  - `contact_email`: `"dr.ananya@citylifelabs.com"`
  - `contact_phone`: `"9893012345"`
  - `industry`: `"Healthcare & Pathology Services"`
  - `turnover_band`: `"1Cr - 5Cr"`
- **Assessment Ratings**:
  - Pillar 1 (Financials): `[q1: 3, q2: 3, q3: 4, q4: 4, q5: 3]` (Score: 18.33 / 25, 73.3%)
  - Pillar 2 (Sales): `[q6: 3, q7: 3, q8: 3, q9: 4]` (Score: 15.00 / 20, 75.0%)
  - Pillar 3 (Marketing): `[q10: 3, q11: 3, q12: 4, q13: 3]` (Score: 11.25 / 15, 75.0%)
  - Pillar 4 (Operations): `[q14: 4, q15: 3, q16: 3, q17: 4]` (Score: 12.50 / 15, 83.3%)
  - Pillar 5 (IT): `[q18: 3, q19: 4, q20: 3, q21: 3]` (Score: 11.25 / 15, 75.0%)
  - Pillar 6 (Governance): `[q22: 4, q23: 3, q24: 3, q25: 3]` (Score: 7.50 / 10, 75.0%)
- **Expected Numerical Result**:
  - `overall_score`: `75.8`
  - `risk_band`: `"Moderate"`
  - Pillar Statuses: Operations: `"Good"`, all others: `"Average"`
- **Expected Report Narrative**: Commend quality controls and NABL compliance; recommend unit margin tracking on diagnostic panels and institutionalizing hospital referral tie-ups.

---

### Test Case 7: Upper Boundary Check (All Rating 4s)
- **Profile**:
  - `company_name`: `"Zenith Global Systems Limited"`
  - `contact_name`: `"Pooja Kapoor"`
  - `contact_email`: `"pooja@zenithglobalsys.com"`
  - `contact_phone`: `"9810012345"`
- **Assessment Ratings**: All 25 questions rated `4`
- **Expected Numerical Result**:
  - `overall_score`: `100.0`
  - `risk_band`: `"Strong"`
  - Pillar Breakdown:
    * Pillar 1: 25.0 / 25 (100.0%) - `"Good"`
    * Pillar 2: 20.0 / 20 (100.0%) - `"Good"`
    * Pillar 3: 15.0 / 15 (100.0%) - `"Good"`
    * Pillar 4: 15.0 / 15 (100.0%) - `"Good"`
    * Pillar 5: 15.0 / 15 (100.0%) - `"Good"`
    * Pillar 6: 10.0 / 10 (100.0%) - `"Good"`
- **Verification Rule**: Mathematical ceiling must never exceed 100.

---

### Test Case 8: Lower Boundary Check (All Rating 1s)
- **Profile**:
  - `company_name`: `"Zero Base Enterprises"`
  - `contact_name`: `"Akash Verma"`
  - `contact_email`: `"akash@zerobase.org"`
  - `contact_phone`: `"9926011111"`
- **Assessment Ratings**: All 25 questions rated `1`
- **Expected Numerical Result**:
  - `overall_score`: `0.0`
  - `risk_band`: `"Critical"`
  - All 6 Pillars: `0.0` score (0.0%) - `"Attention Needed"`
- **Verification Rule**: Mathematical floor must never drop below 0.

---

### Test Case 9: Risk Band Threshold Boundaries
- **Case 9A**: Exact Score = `80.0` -> `"Strong"`
- **Case 9B**: Score = `79.9` -> `"Moderate"`
- **Case 9C**: Exact Score = `60.0` -> `"Moderate"`
- **Case 9D**: Score = `59.9` -> `"Vulnerable"`
- **Case 9E**: Exact Score = `40.0` -> `"Vulnerable"`
- **Case 9F**: Score = `39.9` -> `"Critical"`

---

### Test Case 10: Incomplete Questionnaire / Missing Keys
- **Input**: Only `q1` through `q5` answered; `q6` through `q25` omitted from request.
- **Handling**: Engine must gracefully default missing questions to rating `1` (0 points earned).
- **Behavior**: Does not throw exceptions; correctly computes total answered questions (`5`) out of `25`.

---

### Test Case 11: PII Masking Injection Test
- **Input Payload**:
  - `company_name`: `"ABC Logistics PAN ABCDE1234F"`
  - `notes`: `"Our GSTIN is 27ABCDE1234F1Z5, promoter Aadhaar is 3456 7890 1234, and bank A/C is 12345678901234 with Card 4111 2222 3333 4444."`
- **Expected Redacted Text**:
  - `company_name`: `"ABC Logistics PAN [REDACTED_PAN]"`
  - `notes`: `"Our GSTIN is [REDACTED_GSTIN], promoter Aadhaar is [REDACTED_AADHAAR], and bank Account: [REDACTED_ACCOUNT_NO] with Card [REDACTED_ACCOUNT_NO]."`
- **Verification Rule**: Zero unmasked statutory identifiers reach downstream AI components or logs.

---

### Test Case 12: Invalid Payload & Missing Fields Handling (HTTP 400)
- **Cases Tested**:
  - Missing `company_name` -> Returns HTTP 400 with `company_name is required`.
  - Missing `contact_name` -> Returns HTTP 400 with `contact_name is required`.
  - Invalid `contact_email` (`"not-an-email"`) -> Returns HTTP 400 with `contact_email must be a valid email address`.
  - Invalid `contact_phone` (`"123"`) -> Returns HTTP 400 with `contact_phone must be a valid 10-digit Indian phone number`.
  - Non-POST HTTP Method (e.g., `PUT`) -> Returns HTTP 405 Method Not Allowed.
  - Preflight `OPTIONS` -> Returns HTTP 200 with CORS headers.

---

## 3. Test Automation & Execution Script

All 12 test cases are codified and executable via the standalone Node.js verification script:
```bash
node verify_m3.js
```
The test suite performs real execution across scoring math, PII masking, schema adherence, and serverless handlers.
