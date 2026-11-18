# BookMyRecords — AI Data Privacy & Regulatory Compliance Protocol
**Document Code**: BMR-SEC-DPDP-2026-V1  
**Status**: Approved Architecture & Privacy Policy  
**Effective Date**: November 2026  
**Regulatory Framework**: Digital Personal Data Protection Act, 2023 (India) & Information Technology Act, 2000  

---

## 1. Executive Summary & Privacy Commitment

BookMyRecords provides fractional CFO guidance, business health assessments, forensic diagnostics, and hands-on consulting to Indian micro, small, and medium enterprises (MSMEs). Business owners entrust BookMyRecords with proprietary operational metrics, financial figures, and statutory compliance data.

Our privacy posture rests on a strict guiding rule: **No client financial records, operational metrics, or personal identifying information are ever used to train public artificial intelligence models, stored permanently without consent, or transferred to unauthorized third parties.**

This specification codifies the technical architecture, regulatory alignment, and procedural safeguards that protect client data throughout the Business Health Checkup intake and analysis pipeline.

---

## 2. The Five-Layer Privacy Shield

BookMyRecords enforces a multi-tier defense architecture designed specifically for Indian commercial operations.

```
+-----------------------------------------------------------------------------+
|                     LAYER 1: INFORMED CONSENT & NOTICE                      |
|  - Mandatory explicit consent gate on intake form                           |
|  - Clear declaration of automated scoring + preliminary AI narrative        |
+-----------------------------------------------------------------------------+
                                      |
                                      v
+-----------------------------------------------------------------------------+
|                     LAYER 2: SERVER-SIDE PII SANITIZATION                   |
|  - Statutory ID scrubbing (PAN, Aadhaar, GSTIN, Bank Accounts, Cards)       |
|  - In-flight regex redaction prior to AI prompt assembly                    |
+-----------------------------------------------------------------------------+
                                      |
                                      v
+-----------------------------------------------------------------------------+
|                     LAYER 3: ZERO RETENTION AT REST (RAM ONLY)               |
|  - In-memory stream parsing (no disk writes, no temp files)                 |
|  - Immediate buffer release upon response completion                         |
+-----------------------------------------------------------------------------+
                                      |
                                      v
+-----------------------------------------------------------------------------+
|                     LAYER 4: COMMERCIAL PAID TIER AI CONTRACT               |
|  - Google Gemini API Enterprise / Paid Tier invocation                      |
|  - Contractual guarantee: ZERO model training, zero data retention at AI    |
+-----------------------------------------------------------------------------+
                                      |
                                      v
+-----------------------------------------------------------------------------+
|                     LAYER 5: SYNTHETIC TESTING & AIR-GAP FALLBACK           |
|  - AI_MOCK_MODE=true for local staging, CI/CD, and offline verification     |
|  - Automatic graceful degradation if network or external API is interrupted  |
+-----------------------------------------------------------------------------+
```

### Layer 1: Explicit Informed Consent & Transparency
Every client initiating a Business Health Checkup must actively check a legally binding consent gate:
> *"I confirm that I am authorized to submit this business information. I consent to an automated business health checkup and understand that my data is processed confidentially under BookMyRecords Privacy Standards solely to generate a preliminary assessment and prepare for expert consultation."*

No assessment processing begins without this explicit user affirmation.

### Layer 2: Server-Side PII Sanitization
Before any prompt is formatted for the AI engine, a serverless sanitization filter inspects all free-text fields (company notes, industry descriptions, and extracted document metadata). The engine replaces statutory identifiers with standardized redaction tokens:

| Identifier Type | Regex Signature / Pattern | Redacted Output Token | Rationale |
|---|---|---|---|
| **Indian PAN** | `/\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/gi` | `[REDACTED_PAN]` | Prevents corporate / personal income tax identity leakage |
| **Indian Aadhaar** | `/\b[2-9]{1}[0-9]{3}[\s\-]?[0-9]{4}[\s\-]?[0-9]{4}\b/g` | `[REDACTED_AADHAAR]` | Protects promoter identity; complies with UIDAI regulations |
| **Indian GSTIN** | `/\b[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}\b/gi` | `[REDACTED_GSTIN]` | Scrubbed before PAN regex to avoid nested substring corruption |
| **Credit / Debit Cards** | `/\b(?:\d{4}[-\s]?){3}\d{4}\b/g` | `[REDACTED_ACCOUNT_NO]` | Prevents accidental card number exposure in billing notes |
| **Bank Account Numbers** | `/\b(?:A\/C|Account|Acc|Bank\s+Account)\s*[:#-]?\s*(\d{9,18})\b/gi` | `Account: [REDACTED_ACCOUNT_NO]` | Shields core corporate banking details |

### Layer 3: Zero Retention at Rest (RAM-Only Ephemeral Processing)
In the initial Checkup phase:
- Supporting documents (P&L spreadsheets, balance sheets, trial balances) and form submissions are streamed directly into serverless memory (RAM).
- **Zero document copies are written to persistent disk storage, local temporary directories, or long-term file servers.**
- Once the assessment response is transmitted to the client's browser, the in-memory buffers are de-referenced and purged by the Node.js garbage collector.
- Report persistence across future sessions is explicitly deferred to Phase 2 (Client Portal), where dedicated encrypted storage with client-owned cryptographic keys will be deployed.

### Layer 4: Commercial Paid Tier Protections
BookMyRecords uses Google Gemini 2.5 Flash strictly through the **Google Cloud / Gemini API Paid Tier**. Under Google's enterprise terms of service:
- Customer prompts and responses **are not used to train or improve any Google machine learning models**.
- Customer data is processed statelessly and discarded immediately after generation.
- Free consumer tiers (which permit model tuning on user inputs) are strictly prohibited in the BookMyRecords production runtime.

### Layer 5: Synthetic Testing & Resilient Fallback Engine
To guarantee continuous operations and eliminate unnecessary external data transmissions during development and testing:
- Setting `AI_MOCK_MODE=true` activates an in-process deterministic report synthesizer that produces structured reports matching 100% of the `BusinessHealthReport` schema without making external network calls.
- If the live Gemini API endpoint encounters rate limits, connection latency, or network errors, the engine automatically falls back to this structured generator, ensuring zero downtime and zero data leakage during outages.

---

## 3. Compliance with Indian Statutory Frameworks

### 3.1 Digital Personal Data Protection (DPDP) Act, 2023
As a **Data Fiduciary**, BookMyRecords adheres to the core mandates of the DPDP Act 2023:
1. **Notice & Lawful Purpose (Section 5 & 6)**: The purpose of data collection is strictly limited to evaluating business health, calculating pillar scores, and preparing a consultation agenda.
2. **Data Minimization**: The checkup requests only metrics necessary for diagnostic evaluation (turnover band, 25 governance questions, optional P&L). Promoters are advised never to submit Aadhaar numbers or personal bank credentials.
3. **Accuracy & Determinism**: To prevent biased or erratic AI score fabrication, all numerical health scores (0–100) and pillar ratings are calculated through deterministic JavaScript code. The AI model is restricted to qualitative interpretation of verified figures.
4. **Data Principal Rights**: Users have the right to request deletion of their contact records, review any retained report copies, and withdraw consultation consent at any time by emailing `compliance@bookmyrecords.com`.

### 3.2 Information Technology Act, 2000 & SPDI Rules, 2011
BookMyRecords complies with Section 43A of the IT Act, 2000 and the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011:
- Secure transmission over TLS 1.3.
- Serverless isolation preventing cross-tenant memory access.
- Rigorous credential management: API keys (`GEMINI_API_KEY`) reside exclusively in encrypted serverless environment variables and are never transmitted to client browsers.

---

## 4. Architectural Data Flow & Privacy Gates

```
[Client Browser]
       │
       │ 1. HTTPS POST (TLS 1.3)
       │    Payload: 25 Ratings, Contact Info, Optional Document
       ▼
[Vercel Serverless Function: /api/checkup/analyze]
       │
       ├───► 2. Validate Inputs & Enforce Data Types
       │
       ├───► 3. Execute Deterministic Scoring Engine (code-only, 0-100)
       │
       ├───► 4. Apply PII Sanitizer (Regex mask PAN, GSTIN, Aadhaar, Bank)
       │
       ├───► 5. AI Execution Decision Gate:
       │        ├── If AI_MOCK_MODE=true ──► Run In-Process Synthesizer
       │        └── If Live Paid API ─────► Assemble Redacted Prompt
       │                                             │
       │                                             ▼
       │                                   [Gemini 2.5 Flash Paid Tier]
       │                                   - Zero model training
       │                                   - Strict JSON output
       │                                             │
       │                                             ▼
       ├───► 6. Merge Verified Scores + AI Qualitative Narrative
       │
       ├───► 7. Wipe In-Memory Buffers & Transient Streams
       │
       │ 8. Return BusinessHealthReport JSON
       ▼
[Client Browser UI] (Renders Report & Launches Cal.com Consultation)
```

---

## 5. Security Safeguards & Operational Controls

1. **CORS Policy**: Configured to accept legitimate web origins, with preflight OPTIONS validation and strict method restrictions (GET, POST).
2. **Access Control**: Administrative access to production environment variables and Vercel dashboards requires Multi-Factor Authentication (MFA).
3. **Log Sanitization**: Application logs strictly record timestamp, transaction status, and anonymized report IDs (`BMR-XXXXXXXX`). Raw client PII, uploaded file content, and unredacted financial metrics are never written to server logs.
4. **Breach Notification Protocol**: In the improbable event of an infrastructure incident, BookMyRecords maintains a 72-hour notification protocol in compliance with CERT-In directions and DPDP rules.

---

## 6. Document Revision & Governance

This document is governed by the BookMyRecords Technical Architecture Committee and reviewed semi-annually. Inquiries regarding data protection, right to erasure, or compliance audits may be directed to:

- **Data Protection Officer**: compliance@bookmyrecords.com  
- **Corporate Office**: BookMyRecords Advisory Services, Indore, Madhya Pradesh, India  
- **Website**: https://bookmyrecords.vercel.app  
