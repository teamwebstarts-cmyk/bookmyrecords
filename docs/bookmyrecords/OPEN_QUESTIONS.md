# BookMyRecords — Open Questions & Unverified Information Register

**Document Status**: Official Requirements Register | Version 1.0  
**Effective Date**: November 2026  
**Tracking Purpose**: Categorizes assumptions, unverified details, and decisions required from the client sponsor before final implementation sign-off.

---

## 1. Core Service & Assessment Engine

### Q1.1: Assessment Point Model & Category Inconsistency
- **Observation**: Meeting context cites "~25 assessment points", a "100-point score", and "6 categories: sales, marketing, IT, digital marketing, offline marketing, financials".
- **The Issue**:
  1. 25 questions cannot be divided evenly across 6 categories.
  2. Marketing is split into 3 categories (50% of total audit), while core CFO competencies (Cash Flow, Solvency, Tax Compliance, Internal Controls) are collapsed into a single category.
  3. If each question has equal weight (4 points each), a digital marketing question carries the same weight as business solvency.
- **Client Decision Needed**:
  - Should the 25 points be reorganized into 5 or 6 balanced strategic pillars (Finance & Cash Flow, Tax & Compliance, Operations & Cost, Sales & Marketing, Technology & Controls) with weighted scoring?
  - Or does the client have a specific, pre-determined list of 25 questions with established point allocations?

### Q1.2: Checkup Intake Format & Document Necessity
- **Observation**: The checkup allows document uploads (P&L, Balance Sheet, GST returns) to assist in report generation.
- **Client Decision Needed**:
  - Is document upload mandatory to complete the Checkup, or can a visitor receive a preliminary report based purely on answering questionnaire inputs? (Recommendation: Questionnaire-first, with document upload optional for deeper analysis).
  - What exact file formats are approved (PDF, XLSX, CSV)?

### Q1.3: Official Health Score Determinism
- **Observation**: An LLM should not invent or independently calculate an official numerical score.
- **Client Decision Needed**:
  - Confirm that the 0–100 score will be computed using a deterministic rule-based formula based on input values, with the AI model generating narrative explanations, observations, and recommendations.

---

## 2. Commercials & Pricing Strategy

### Q2.1: Published Pricing vs Enquiry-First Model
- **Observation**: `pricing.html` contains demo placeholder prices ($170 hourly / $270 daily). `accounting-outsourcing.html` mentions "Growth and Premium plans" without publishing rupee amounts.
- **Client Decision Needed**:
  - Is the Business Health Checkup completely free (lead magnet) or paid?
  - Will fixed package prices be published for Accounting Outsourcing (e.g. Starter ₹4,999/mo, Growth ₹9,999/mo), or should all CTAs drive to consultation booking / custom enquiry?
  - Are government statutory filing fees (MCA stamp duty, Trademark filing fees, GST registration) presented as separate out-of-pocket expenses?

---

## 3. Data Privacy & AI Processing Approval

### Q3.1: External AI Processing Consent & Confidentiality
- **Observation**: Financial records and business documents contain sensitive commercial data. The client previously raised data privacy concerns regarding external AI services.
- **Client Decision Needed**:
  - What specific privacy consent text must be displayed before a user uploads financial documents?
  - Is automated document processing via enterprise AI APIs (such as Google Gemini with zero-data-retention terms) formally approved?
  - What document retention period is required before uploaded temporary files are permanently purged from server memory?

---

## 4. Corporate Identity & Personnel Verification

### Q4.1: Team Leadership & Partner Personas
- **Observation**: `about.html` and `index.html` list Saket Rathore (Founding Partner), Priya Mehta (GST Head), Arjun Kapoor (Audit Partner), and Neha Khatri (NRI Tax) with template stock photos and `example123@gmail.com`.
- **Client Decision Needed**:
  - Are these four individuals real partners at BookMyRecords, and will authentic professional portraits and bios be provided?
  - If they are representative personas, should they be replaced with real team credentials or reframed as a generic practice specialist block?

### Q4.2: Customer Testimonials & Historical Offerings
- **Observation**: `index.html` features 6 testimonials, including one from Riya Verma claiming job placement at Deloitte through a "Tally Prime Course".
- **Client Decision Needed**:
  - Are all 6 testimonials real client reviews authorized for public display?
  - Does BookMyRecords currently offer vocational Tally training/placement, or should this testimonial be replaced with a corporate business consulting review?

### Q4.3: Physical Address Reconciliation
- **Observation**: `contact.html` contains a spliced address combining Indore and Jabalpur: `"123, CA Chambers, Civil Lines, 107, Silver Arc Plaza... Indore (M.P.) – 452001 — 482001"`.
- **Client Decision Needed**:
  - Confirm the exact official address to display across all footer and contact locations (e.g. 107 Silver Arc Plaza, Janjeerwala Square, Indore, MP 452001).
