# BookMyRecords — Streamlined Business Health Assessment User Journey
**Version**: 2.0 (Streamlined Document-Intake Architecture)  
**Target Milestone**: Milestone 4 (Streamlined Intake, AI Diagnostic Report & Cal.com Scheduling)  
**Date**: November 2026  
**Audience**: Product Management, Frontend Engineering, Design & Advisory Operations

---

## 1. Executive Journey Overview

Following the official product directive, BookMyRecords eliminates visitor friction by replacing tedious, public-facing 25-question diagnostic forms with a streamlined, zero-login business document intake flow. 

Visitors do not answer a 25-question quiz. Instead, our 24 assessment criteria across the 6 business pillars remain strictly **internal** to the AI evaluation engine, system prompt, and deterministic scoring rubric. Visitors provide only basic enterprise profile details, an optional financial document (P&L, GST return, Balance Sheet, Bank Statement) via drag-and-drop, and operational challenge notes.

```
+------------------------------------------------------------------------------------------------+
|                                  STREAMLINED VISITOR FUNNEL                                    |
|                                                                                                |
|  [ Stage 0: Homepage Teaser ]                                                                  |
|         |                                                                                      |
|         v (CTA: "Get Free Health Assessment")                                                  |
|  [ Step 1: Intake Form ]                                                                       |
|         ├── Basic Business Profile (Enterprise Name, Founder, Email, Phone, Industry, Turnover) |
|         ├── Drag-and-Drop Financial Document Dropzone (PDF, XLSX, CSV <= 4MB)                 |
|         ├── Operational Notes & Pain Points (Optional)                                         |
|         └── Mandatory DPDP Act 2023 Consent Checkbox                                           |
|         |                                                                                      |
|         v (Submit: "Analyze Business Health & Generate Report")                                |
|  [ Step 2: Live Processing Screen ]                                                            |
|         ├── 5 Sequential Status Steps (Profile -> PII Redaction -> 24 Internal Criteria         |
|         │    Evaluation -> Strategic Growth Synthesis -> Report Finalization)                  |
|         |                                                                                      |
|         v (Auto-transitions upon 200 OK response)                                              |
|  [ Step 3: Preliminary Business Health Report View ]                                           |
|         ├── Report Header with Unique ID (BMR-YYYYMMDD-XXXX)                                   |
|         ├── Deterministic Score Radial Dial (0-100) & Risk Band (Strong, Moderate, etc.)       |
|         ├── 6 Pillar Breakdown Cards (Financial, Sales, Marketing, Operations, IT, Governance) |
|         ├── Executive Summary, Key Strengths & Critical Operational Gaps                       |
|         ├── 30 / 60 / 90 Day Strategic Roadmap                                                 |
|         └── Action CTAs: Print / Save PDF, Retake, Discuss with Senior Consultant              |
|         |                                                                                      |
|         v (Advance CTA: "Discuss Your Report With a Senior Consultant")                        |
|  [ Step 4: Cal.com Consultation Booking ]                                                      |
|         ├── Embedded Cal.com Scheduling Widget (#cal-inline-embed)                              |
|         ├── Prefilled with Visitor Name, Email, Phone, Assessment ID                           |
|         └── Direct Fallback Links & Phone Consultation Hotline (+91 96696 93315)               |
+------------------------------------------------------------------------------------------------+
```

---

## 2. Granular Stage-by-Stage User Flow

### Stage 0: Homepage Teaser & Value Proposition
1. **User Action**: Visitor lands on `index.html`. Directly beneath the hero banner, they see the dedicated **Business Health Checkup Teaser Section** (`#health-checkup-teaser`).
2. **Visual & Psychological Cues**:
   - High-contrast trust badges: *100% Free*, *No Login Required*, *Instant AI Analysis*, *Confidential & DPDP Compliant*.
   - Six preview cards illustrating the six pillars evaluated behind the scenes (Financial 25%, Sales 20%, Marketing 15%, Operations 15%, IT 15%, Governance 10%).
   - Direct copy: *"Upload your financial documents (P&L, GST, balance sheet) or business summary to get an instant, confidential 24-point AI diagnostic report — 100% Free, No Login Required."*
3. **Primary CTA**: Visitor clicks `"Get Free Health Assessment"`, navigating directly to `checkup.html`.

---

### Step 1: Business Profile & Document Intake (Step 1)
1. **Objective**: Minimize data entry overhead while collecting necessary business context and optional statutory/financial documentation.
2. **Input Fields**:
   - **Company / Enterprise Name** (`company_name`): Minimum 2 characters.
   - **Founder / Contact Person** (`contact_name`): Minimum 2 characters.
   - **Business Email** (`contact_email`): Valid email format.
   - **10-Digit Mobile Number** (`contact_phone`): Indian standard 10-digit number (`^(\+91)?[0]?[6-9]\d{9}$`).
   - **Industry Sector** (`industry`): Dropdown covering 10 Indian industry verticals (Manufacturing, IT, Retail, Healthcare, Logistics, etc.).
   - **Annual Turnover Band** (`turnover_band`): Dropdown categorizing turnover scale (<₹50 Lakhs to >₹25 Crores).
   - **Drag-and-Drop Document Zone**:
     - Dedicated dropzone accepting financial statements, GST returns, balance sheets, or trial balances.
     - Supported formats: `.pdf, .xlsx, .xls, .csv` up to 4 MB.
     - Dragover feedback and active file pill showing file name, size, verification icon, and remove trigger.
   - **Operational Challenges / Notes** (`notes`): Optional textarea for founders to describe cash flow hurdles, inventory bottlenecks, or hiring challenges.
   - **Mandatory Privacy Consent**:
     - Checkbox: *"I consent to confidential business health assessment processing under BookMyRecords Privacy Standards and the Digital Personal Data Protection (DPDP) Act 2023."*
     - Clear statement that data is processed ephemerally in RAM with statutory PII stripped.
3. **Submission Gate**:
   - Client-side validation checks all required fields, mobile number format, file size (< 4 MB), and consent checkbox.
   - Clicking `"Analyze Business Health & Generate Report"` immediately advances the view to Step 2.

---

### Step 2: Live Processing & Internal Evaluation
1. **Visual Experience**:
   - Clean, professional full-screen progress animation with an animated spinner.
   - Step tracker displaying sequential micro-progress:
     1. *Validating company profile & operational parameters...*
     2. *Sanitizing statutory PII (PAN, GSTIN, Bank details)...*
     3. *Evaluating against 24 internal financial & operational criteria...*
     4. *Synthesizing strategic growth roadmap & insights...*
     5. *Finalizing preliminary Business Health Report...*
2. **Behind-the-Scenes Activity**:
   - Browser sends POST to `/api/checkup/analyze` with `FormData` (or JSON if no file attached).
   - Serverless function scrubs all PII using lookaround regex patterns.
   - Evaluates internal signals against the 24 criteria across 6 pillars.
   - Invokes Gemini 2.5 Flash API (or high-fidelity synthetic fallback).
   - Calculates deterministic scores (0–100) via `calculateHealthScore`.
   - On completion (typically 2–3 seconds), automatically transitions to Step 3.

---

### Step 3: Preliminary Business Health Report View
1. **Header & Context**:
   - Unique Assessment ID (e.g., `BMR-20261117-7429`), business name, turnover scale, industry sector, and generation date.
2. **Radial Score Dial & Risk Classification**:
   - Prominent circular score dial (0–100) with dynamic color styling:
     - **Strong** (80.0–100): Emerald Green
     - **Moderate** (60.0–79.9): Sapphire Blue
     - **Vulnerable** (40.0–59.9): Warm Amber
     - **Critical** (0–39.9): Ruby Red
3. **6 Pillar Breakdown Cards**:
   - Visual progress bars for each pillar:
     - Financial Health & Statutory Compliance (Max 25 pts)
     - Sales & Revenue Pipeline (Max 20 pts)
     - Marketing & Brand Positioning (Max 15 pts)
     - Operational Efficiency & SOPs (Max 15 pts)
     - IT, Systems & Digital Readiness (Max 15 pts)
     - Governance, Legal & IPR Protection (Max 10 pts)
   - Status badge on each pillar (*Good*, *Average*, *Attention Needed*).
4. **Actionable Strategic Insights**:
   - Executive Summary summarizing organizational health.
   - Two-column comparative matrix: *Key Business Strengths* vs *Critical Operational Gaps* (with severity badges).
   - Structured 30 / 60 / 90 Day Strategic Roadmap.
5. **Call-to-Action Bar**:
   - `"Print / Save PDF Report"`: Launches clean, unstyled print view.
   - `"Analyze Another Business"`: Resets the wizard to Step 1.
   - `"Discuss Your Report With a Senior Consultant"`: Advances to Step 4.

---

### Step 4: Cal.com Consultation Scheduling
1. **Consultation Pitch**:
   - Value proposition: *"Complimentary 30-Minute Fractional CFO & Operational Review"*.
   - Explains that a senior advisory specialist has reviewed the report and will walk through tax savings, working capital optimization, and compliance stabilization.
2. **Embedded Calendar Integration**:
   - Mounts the official Cal.com vanilla JS embed inside `#cal-inline-embed`.
   - Automatically pre-populates visitor's Name, Email, Phone, and Assessment ID.
3. **Resilience & Fallbacks**:
   - Direct button link: `https://cal.com/bookmyrecords/checkup-consultation`.
   - Direct phone consultation link: `tel:+919669693315`.

---

## 3. Decision & Error Recovery Matrix

| Exception Condition | System Detection | User Remediation / Fallback |
|---|---|---|
| Incomplete profile inputs | Form validator identifies missing field | Field highlights with red outline; focus moves to first invalid field |
| Invalid 10-digit mobile number | Regex validation `^(\+91)?[0]?[6-9]\d{9}$` | Displays inline guidance: "Please enter a valid 10-digit Indian mobile number" |
| Oversized upload (> 4 MB) | Client byte check `file.size > 4 * 1024 * 1024` | Alert notifies 4 MB limit; file pill removed and dropzone reset |
| Unsupported file format | Check file extension against `.pdf, .xlsx, .xls, .csv` | Alert informs allowed extensions; clears file selection |
| Missing DPDP consent | Checkbox state check `!consent.checked` | Red focus glow on consent checkbox with helper prompt |
| Server API timeout or error | Fetch rejection or non-200 HTTP response | Alert modal explains issue with 1-click retry; form data preserved |
| Cal.com iframe blocked | Ad-blocker or script block | Prominent fallback card provides direct booking URL and telephone hotline |
