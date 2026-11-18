# BookMyRecords — End-to-End Technical Architecture & Integration Flow
**Version**: 2.0 (Streamlined Document-Intake Architecture)  
**Target Milestone**: Milestone 4  
**Date**: November 2026  
**Audience**: Backend Engineers, DevOps, Security Officers, AI Integration Specialists

---

## 1. System Architecture Overview

The BookMyRecords platform decouples client-facing interaction from internal diagnostic evaluation. Rather than burdening the user with a 25-question quiz, the system processes basic enterprise profile details, optional financial files, and founder notes through an ephemeral serverless pipeline (`/api/checkup/analyze.js`).

The 24 assessment criteria across the 6 business pillars remain strictly **internal** to the AI evaluation engine, system prompt, and deterministic scoring rubric.

```
+---------------------------------------------------------------------------------------------------+
|                                  END-TO-END DATAFLOW PIPELINE                                     |
|                                                                                                   |
|  [ Client Browser: checkup.html & checkup.js ]                                                   |
|         |                                                                                         |
|         |  1. HTTPS POST (multipart/form-data with file OR application/json)                      |
|         v                                                                                         |
|  [ Vercel Serverless Function: /api/checkup/analyze.js ]                                          |
|         |                                                                                         |
|         +---> 2. In-Memory Stream Buffer Parsing (Zero Disk I/O)                                   |
|         +---> 3. Statutory PII Redaction Engine (PAN, GSTIN, Aadhaar, Cards, Bank Accounts)       |
|         +---> 4. Internal Assessment Criteria Evaluator (evaluateInternalCriteria)                |
|         |        ├── Evaluates profile signals, turnover scale, industry & notes against         |
|         |        │   24 criteria across 6 pillars                                                 |
|         |        └── Injects 24 criteria rubric into Gemini 2.5 Flash system prompt                |
|         |                                                                                         |
|         +---> 5. Deterministic Mathematical Scoring Engine (calculateHealthScore in score.js)     |
|         |        └── Guarantees mathematical isolation: LLM never computes official score (0-100)|
|         |                                                                                         |
|         +---> 6. AI Strategic Report Synthesis:                                                   |
|         |        ├── Gemini 2.5 Flash API (Strict JSON Schema, temp=0.1)                          |
|         |        └── High-Fidelity Synthetic Fallback (Deterministic, offline-safe)               |
|         |                                                                                         |
|         +---> 7. JSON Response (BusinessHealthReport Schema)                                      |
|         v                                                                                         |
|  [ Client Browser Renders Preliminary Report (Step 3) ]                                           |
|         |                                                                                         |
|         |  8. Cal.com Vanilla JS Embed Initialization (Cal("inline", ...))                        |
|         v                                                                                         |
|  [ Cal.com Iframe (Prefilled: Name, Email, Phone, Report ID) -> Advisor Calendar Sync ]           |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Frontend-to-Backend Lifecycle

### A. Client Request Construction (`assets/js/checkup.js`)
When the user submits the assessment in Step 1:
1. **Payload Construction**:
   - If a document file is attached (PDF, XLSX, XLS, CSV <= 4 MB), the client instantiates a `FormData` object containing:
     - `company_name`: string
     - `contact_name`: string
     - `contact_email`: string
     - `contact_phone`: string
     - `industry`: string
     - `turnover_band`: string
     - `notes`: string
     - `document`: File binary
   - If no document is attached, a clean `application/json` payload is dispatched.
2. **Network Transport**:
   - Sent via native `fetch('/api/checkup/analyze', { method: 'POST', body })`.

---

### B. In-Memory Ephemeral Serverless Processing (`/api/checkup/analyze.js`)
1. **Multipart Buffer Parsing**:
   - The serverless function streams the incoming binary chunks into memory (`Buffer.concat(chunks)`).
   - Extracts boundary delimiters and separates form fields from file buffers without creating temporary files on disk.
2. **Input Validation**:
   - Company and contact names validated (minimum 2 characters).
   - Email format validated via standard regex.
   - Phone sanitized to 10-digit Indian standard (`^[6-9]\d{9}$`).
   - Supports both explicit answer maps (for backward compatibility) and streamlined intake flow.

---

### C. Statutory PII Redaction Engine (DPDP Act 2023 Shield)
Before any text is passed to external AI services or returned in observations, the statutory redaction engine runs regex lookarounds to neutralize sensitive identifiers:
1. **GSTIN (15 characters)**:
   - Pattern: `/(?<=^|[^A-Za-z0-9])[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}(?=$|[^A-Za-z0-9])/gi`
   - Replaced with: `[REDACTED_GSTIN]`
2. **PAN (10 characters)**:
   - Pattern: `/(?<=^|[^A-Za-z0-9])[A-Z]{5}[0-9]{4}[A-Z]{1}(?=$|[^A-Za-z0-9])/gi`
   - Replaced with: `[REDACTED_PAN]`
3. **Aadhaar (12 digits)**:
   - Pattern: `/(?<=^|[^0-9])[2-9]{1}[0-9]{3}\s?[0-9]{4}\s?[0-9]{4}(?=$|[^0-9])/g`
   - Replaced with: `[REDACTED_AADHAAR]`
4. **Credit/Debit Card Numbers (13–19 digits)**:
   - Pattern: `/(?<=^|[^0-9])(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|6(?:011|5[0-9]{2})[0-9]{12}|3[47][0-9]{13})(?=$|[^0-9])/g`
   - Replaced with: `[REDACTED_CARD]`
5. **Bank Account Numbers (9–18 digits)**:
   - Pattern: `/(?<=account(?:\s+no|\s+number|#)?\s*[:=\-]?\s*)[0-9]{9,18}(?=$|[^0-9])/gi`
   - Replaced with: `[REDACTED_ACCOUNT]`

---

### D. Behind-the-Scenes 24 Assessment Criteria Evaluation
The internal evaluation engine (`evaluateInternalCriteria`) maps business profile signals, turnover tier, industry vertical, attached document metadata, and keyword notes into deterministic ratings (1 to 4) across the 24 internal criteria:
- **Pillar 1: Financial Health & Statutory Compliance (25%)**:
  - `q1`: Monthly Bookkeeping & P&L Discipline
  - `q2`: Cash Flow Forecasting & Working Capital Runway
  - `q3`: Statutory Tax & GST Compliance
  - `q4`: Receivables & DSO Monitoring
  - `q5`: Profit Margin Tracking & Unit Economics
- **Pillar 2: Sales & Revenue Pipeline (20%)**:
  - `q6`: CRM & Sales Pipeline Tracking
  - `q7`: Customer Acquisition Channel Diversity
  - `q8`: Customer Concentration Risk
  - `q9`: Pricing Strategy & Margin Review
- **Pillar 3: Marketing & Brand Positioning (15%)**:
  - `q10`: Digital Presence & Website Conversion
  - `q11`: Marketing Budget & ROI Attribution
  - `q12`: Customer Feedback & Retention Loop
  - `q13`: Competitive Differentiation Strategy
- **Pillar 4: Operational Efficiency & SOPs (15%)**:
  - `q14`: Standard Operating Procedures (SOPs)
  - `q15`: Vendor & Supply Chain Management
  - `q16`: Quality Control & Defect Resolution
  - `q17`: Key Person Dependency Risk
- **Pillar 5: IT, Systems & Digital Readiness (15%)**:
  - `q18`: Core Business Software Integration
  - `q19`: Data Backup & Disaster Recovery
  - `q20`: Cybersecurity & Access Control
  - `q21`: Cloud & Modern Tool Adoption
- **Pillar 6: Governance, Legal & IPR Protection (10%)**:
  - `q22`: Entity Structuring & Statutory Registrations
  - `q23`: Founder & Shareholder Agreements
  - `q24`: Trademark, IP & Brand Protection
  - `q25`: Annual Secretarial & Board Compliance

---

### E. Deterministic Mathematical Scoring Engine (`/api/checkup/score.js`)
1. **Mathematical Isolation**:
   - The LLM NEVER computes or alters the official health score.
   - Each question score is derived deterministically:
     $$\text{Points Earned} = \left( \frac{\text{Rating} - 1}{3} \right) \times \text{Question Points}$$
   - Questions in each pillar are aggregated, rounded to 1 decimal place, and compared against pillar thresholds to assign status badges (*Good*, *Average*, *Attention Needed*).
   - Overall score (0 to 100) maps directly to standard risk bands:
     - $\ge 80.0 \implies \text{Strong}$
     - $60.0 - 79.9 \implies \text{Moderate}$
     - $40.0 - 59.9 \implies \text{Vulnerable}$
     - $< 40.0 \implies \text{Critical}$

---

### F. Cal.com Consultation Scheduling Integration
1. **Embedding Architecture**:
   - Loaded via official script `https://app.cal.com/embed/embed.js`.
   - Initialized via `Cal("inline", { elementOrSelector: "#cal-inline-embed", calLink: "bookmyrecords/checkup-consultation", ... })`.
   - Form parameters prefilled: `name`, `email`, `notes` (including Phone and Assessment ID).
2. **Resilience**:
   - Provides native direct links and phone consultation numbers if third-party scripts fail to load.
