# BookMyRecords — Architecture Decision Record (ADR)
**Decision Status**: Approved  
**Date**: November 2026  
**Architecture Owner**: Technical Architecture Team  

## 1. Context & Problem Statement
BookMyRecords requires an intelligent Business Health Checkup intake pipeline that accepts business responses and financial documents (PDF, Excel, CSV), performs deterministic scoring and AI narrative analysis, and enables direct consultation scheduling. 

The client has strict data confidentiality requirements: **no real client financials must be used to train AI models, no sensitive client data may leak into public logs, and scoring must remain transparent and mathematically sound.**

## 2. Decision
We have decided to adopt **Option 2: Lightweight Serverless Architecture on Vercel using Node.js API Functions**.

### Architecture Diagram
```
+-----------------------------------------------------------------------------------+
|                                 CLIENT BROWSER                                    |
|  +-----------------------------------------------------------------------------+  |
|  | index.html (Teaser Card)  --->  checkup.html (Multi-Step Assessment Wizard) |  |
|  |   - 25 Question Assessment                                                  |  |
|  |   - Drag-and-Drop Document Uploader (PDF / XLSX / CSV <= 4 MB)              |  |
|  |   - Client-side Validation & PII Pre-checks                                 |  |
|  +---------------------------------------+-------------------------------------+  |
+------------------------------------------|----------------------------------------+
                                           | HTTPS POST (multipart/form-data)
                                           v
+-----------------------------------------------------------------------------------+
|                        VERCEL SERVERLESS RUNTIME (Node.js)                        |
|  +-----------------------------------------------------------------------------+  |
|  | /api/checkup/analyze.js                                                     |  |
|  |   1. In-Memory File Buffer (Zero disk persistence)                          |  |
|  |   2. Deterministic Scoring Engine (Calculates 0-100 score mathematically)   |  |
|  |   3. PII Sanitizer (Masks PAN, Aadhaar, GSTIN, Bank Accounts via Regex)     |  |
|  |   4. Secure Gemini 2.5 Flash API Call (Server-side key, JSON schema enforced|  |
|  |   5. Structured Output Validation (Zod Schema)                              |  |
|  |   6. Ephemeral Memory Wipe                                                  |  |
|  +---------------------------------------+-------------------------------------+  |
+------------------------------------------|----------------------------------------+
                                           |
                   +-----------------------+-----------------------+
                   |                                               |
                   v                                               v
+-------------------------------------+         +-------------------------------------+
|      GOOGLE GEMINI API (Paid Tier)  |         |        CAL.COM EMBED ENGINE         |
|  - Model: gemini-2.5-flash          |         |  - Inline Vanilla JS Embed          |
|  - Contract: ZERO Model Training    |         |  - Styled to BMR Blue (#0B5ED7)     |
|  - Structured JSON Output           |         |  - 2-Way Google Calendar Sync       |
|  - Rapid Response (<5s)             |         |  - Pre-fills Client Name/Email/Phone|
+-------------------------------------+         +-------------------------------------+
```

## 3. Rationale & Justification
1. **Security & Zero Leaks**: Vercel serverless isolates the `GEMINI_API_KEY`. Customer documents remain in RAM and evaporate upon function completion.
2. **Scoring Integrity**: Rule-based code calculates category weights and scores. The LLM is restricted to qualitative interpretation, eliminating hallucinations.
3. **No Overhead**: Built directly on the repository's existing Vercel deployment without maintaining servers, databases, or third-party workflow subscriptions.
4. **Instant Scalability**: Handles sudden traffic spikes without dropped webhooks or rate throttling.

## 4. Implementation Specifications
- **Function Location**: `/api/checkup/analyze.js`
- **Helper Endpoints**: `/api/checkup/health.js` (Liveness ping)
- **Environment Variables**:
  - `GEMINI_API_KEY` (Required for live mode)
  - `AI_MOCK_MODE` (Set to `true` for local development and QA without API billing)
  - `CAL_EVENT_LINK` (e.g. `bookmyrecords/checkup-consultation`)
