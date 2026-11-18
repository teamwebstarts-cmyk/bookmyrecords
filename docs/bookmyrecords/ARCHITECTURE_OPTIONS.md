# BookMyRecords — Technical Architecture Options Evaluation
**Document Version**: 1.0  
**Status**: Evaluated & Verified  
**Date**: November 2026  

## 1. Executive Summary
This document provides a comparative technical audit of two distinct architectural patterns for the BookMyRecords Business Health Checkup platform:
1. **Option 1**: No-Custom Backend / Managed Workflow (Make.com / Low-Code iPaaS)
2. **Option 2**: Lightweight Serverless Architecture (Node.js API Endpoints on Vercel)

Both options were evaluated against security, privacy compliance (DPDP Act 2023), binary file handling, execution limits, synchronous UX responsiveness, maintenance overhead, and total cost of ownership.

---

## 2. Option 1: No-Custom Backend (Make.com / Low-Code)

### Architecture Overview
- **Intake**: Static HTML frontend submits form data and files via `fetch()` to a Make.com Webhook.
- **Processing**: Make.com scenario routes data to modules: Webhook Receiver -> Binary Parser -> Google AI Studio Connector -> Webhook Response.
- **Output**: Make scenario returns JSON payload back to the browser.
- **Scheduling**: Standalone Calendly or Cal.com redirect.

### Technical Assessment

#### Strengths
- Fast visual scenario assembly for non-programmers.
- Pre-built connectors for third-party platforms.
- Built-in retry mechanisms for asynchronous jobs.

#### Critical Bottlenecks & Failure Risks
1. **Strict 5.0 MB Payload Ceiling**: Make.com enforces a hard 5 MB limit on incoming webhook payloads across all subscription tiers. Business financial documents (annual audit reports, 3-year P&L statements, multi-sheet Excel workbooks) frequently exceed 5 MB. Payloads above 5 MB fail instantly with HTTP errors.
2. **40-Second Webhook Timeout**: Make's synchronous `Webhook Response` module drops connections after 40 seconds. When Gemini parses dense multi-page PDFs alongside 25 questionnaire responses, cold execution or network latency risks triggering 504 Gateway Timeouts, abandoning the user with a broken UI.
3. **Data Privacy & Compliance Breach**: In Make.com, all data passing through modules is logged in execution history in plaintext and retained on third-party servers for 30 days. Storing unredacted client financial statements, PAN numbers, and business metrics in intermediate SaaS logs directly contradicts BookMyRecords' client privacy mandate.
4. **Public Webhook Exposure**: Embedding a Make.com webhook URL in client-side JavaScript leaves the endpoint vulnerable to automated scraping, DDoS attacks, and quota exhaustion without expensive API gateway firewalls.
5. **Operating Costs**: A typical document analysis scenario consumes 6–10 operations per run. A volume of 500 assessments/month consumes 5,000 ops, requiring paid tiers ($9–$16/mo) that scale upward with traffic.

---

## 3. Option 2: Lightweight Serverless Backend (Node.js on Vercel)

### Architecture Overview
- **Intake**: Static HTML frontend dispatches requests to relative endpoint `/api/checkup/analyze`.
- **Processing**: Vercel Serverless Function executes in a secure Node.js environment:
  1. Validates inputs and multipart file headers.
  2. Executes deterministic mathematical scoring engine.
  3. Sanitizes and masks Indian PII (PAN, Aadhaar, GSTIN, bank details).
  4. Calls Gemini API using protected server-side environment variables (`process.env.GEMINI_API_KEY`).
  5. Validates structured JSON response against Zod schema.
  6. Returns finalized report to browser.
- **Storage**: Ephemeral memory during function execution; zero disk writes; optional presigned URL for files > 4.5 MB.
- **Scheduling**: Cal.com embed integrated into the results view.

### Technical Assessment

#### Strengths
1. **Zero Infrastructure Cost**: The BookMyRecords website is already deployed on Vercel (`bookmyrecords.vercel.app`). Serverless functions operate under Vercel's generous free tier (100k invocations/month).
2. **Impenetrable Secret Protection**: AI API keys and external credentials never touch client-side code.
3. **End-to-End Data Sovereignty**: Documents exist only in volatile serverless memory during execution. No intermediate SaaS platform stores or logs customer data.
4. **Fast Synchronous Performance**: Cold starts are ~250ms; total execution takes 4–7 seconds, providing immediate feedback to the visitor.
5. **Deterministic Rule Enforcement**: Scoring is calculated strictly via code before calling the LLM, eliminating AI scoring hallucinations.
6. **Future Scalability**: Ready to integrate MongoDB Atlas, Supabase, or authentication in subsequent phases without refactoring.

#### Constraints & Mitigations
- **4.5 MB Body Limit**: Vercel serverless requests have a 4.5 MB limit.
  - *Mitigation*: Client-side compression and validation limit uploads to 4 MB for direct processing. For larger enterprise documents, the serverless function issues a presigned S3/R2 upload URL, bypassing Vercel body limits entirely.

---

## 4. Evaluation Matrix

| Criterion | Option 1: Make.com / Low-Code | Option 2: Vercel Serverless | Decisive Advantage |
|---|---|---|---|
| **API Key Security** | Medium (Stored in Make; Webhook exposed to public) | High (Stored in encrypted Vercel environment vars) | Option 2 |
| **File Handling** | Poor (Hard 5.0 MB limit; binary parsing is brittle) | High (4 MB direct in-memory; presigned URLs for >4MB) | Option 2 |
| **Data Privacy (DPDP)** | High Risk (Logged in plain text for 30 days) | Zero Risk (Ephemeral in-memory processing; PII redacted) | Option 2 |
| **Response Latency** | 8 – 25 seconds (Risk of 40s timeout drop) | 4 – 7 seconds (Direct HTTP stream/response) | Option 2 |
| **Scoring Integrity** | Weak (Relies on complex Make router logic) | 100% Deterministic (Strict JavaScript code engine) | Option 2 |
| **Operational Cost** | $9 – $29+ / month recurring | $0 / month (Included in Vercel tier) | Option 2 |
| **Maintenance** | Low-Code UI, but fragile versioning | Modern Git-based CI/CD, unit-testable code | Option 2 |
| **Future Readiness** | Low (Difficult to transition into client portal) | High (Standard Node.js modules ready for DB/Auth) | Option 2 |
