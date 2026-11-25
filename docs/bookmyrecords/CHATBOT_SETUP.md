# Book My Records Chatbot — Feature Branch Setup

This feature adds a public-facing, text-output service advisor with typed or browser speech-to-text input. It runs inside the existing Node.js HTTP server; it does not add Express or a second server.

## Current architecture

- Frontend: vanilla JavaScript widget and BMR-branded CSS.
- API: `POST /api/chat/message` mounted in `server.js`.
- Knowledge retrieval: local, source-linked keyword/IDF retrieval from the repository's service pages and Book My Records documentation.
- Model: existing OpenAI-compatible provider configuration (`AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL`), overridable with `CHATBOT_AI_API_KEY` and `CHATBOT_AI_MODEL`.
- Session memory: opt-in, bounded recent turns in process memory only; no MongoDB/Supabase transcript persistence.
- Voice: Web Speech API in supported browsers, transcript remains editable and user sends it. No audio response / TTS is produced.

## Render environment variables

Required for live AI:
- `AI_BASE_URL`: OpenAI-compatible API base URL ending before `/chat/completions`.
- `AI_API_KEY`: provider API key (reuse only if the existing provider should also handle chat), or set `CHATBOT_AI_API_KEY` to isolate the chatbot credential.
- `AI_MODEL`: configured provider model, or set `CHATBOT_AI_MODEL` to override for chat.

Optional:
- No database variables are required for chatbot memory. Opt-in chat context stays in process memory for up to 30 minutes and is lost on Render restart or when routed to another instance.
- `CHATBOT_AI_API_KEY` and `CHATBOT_AI_MODEL`: recommended separate chatbot credentials/config.
- For a frontend hosted on a different origin, define `window.BMR_CHAT_CONFIG = { apiBase: 'https://bookmyrecords-api.onrender.com' }` before loading the widget. On the existing Vercel site, the same-origin `/api/*` rewrite can use the default empty API base.

Do not place API credentials in browser code, HTML or committed files. Production should use a commercial/API plan consistent with the approved AI data privacy protocol; do not send confidential client financial documents to public/free consumer AI tiers.

## Run locally

```bash
npm install
AI_BASE_URL=https://your-provider.example/v1 AI_API_KEY=... AI_MODEL=... npm start
``

Open `http://localhost:8765`. The endpoint is `POST http://localhost:8765/api/chat/message`.

## Verify

```bash
npm run test:chatbot
npm run index:chatbot
```

The test script checks chunking, Hindi/English token normalization and basic PII redaction. The retrieval evaluation prints top matching service labels for representative questions.

## Current limitations / production hardening

1. This is a public website advisor. It intentionally does not accept dashboard mode, client IDs, report IDs, or personal account context. Add authenticated dashboard APIs only after the dashboard has a real verified session/JWT and server-side tenant authorization.
2. Retrieval is local lexical/IDF and not vector embeddings yet. It is deterministic and has no external embedding dependency, but semantic matching/typos can be improved later with embeddings while retaining source-level citations.
3. Browser SpeechRecognition is available mainly in Chromium browsers and requires HTTPS. Unsupported browsers fall back to typed input; the UI does not upload audio to a third party.
4. Session context is volatile process memory only, opt-in, limited to 10 turns and expires after 30 minutes. It is not durable across Render restarts or multiple instances. Do not enter private financial records, PAN, Aadhaar, OTPs, credentials or full card numbers.
5. API rate limiting is currently per-process/per-IP and does not replace a distributed rate limiter behind multiple Render instances. Configure trusted proxy/IP handling and a shared rate limiter before high-volume launch.
6. Configure allowed production CORS origins, privacy notice, consent/retention policy and monitoring before public production rollout.
7. Pricing, government timelines, tax/legal outcomes and loan eligibility must not be invented; the advisor is instructed to decline unsupported particulars and refer users to the BMR team.

## Widget inclusion

All 19 public HTML pages (excluding the admin dashboard) load:
- `assets/css/bmr-chatbot.css`
- `assets/js/bmr-chatbot.js`

Include the same assets before `</body>` on any additional public page that needs the widget. The excluded `admin.html` stays excluded until it has a separate authenticated dashboard chatbot design and authorization contract.

### Session and transcript policy

Public website sessions use process-local, short-lived conversation context (30 minutes) only. Chat transcripts are not persisted to MongoDB or Supabase in this release. The anonymous continuity token is stored in the current browser tab's `sessionStorage`, not as an authentication credential. Render restarts or multiple instances may reset/fragment this memory. Persistent memory must be introduced only with an explicit privacy notice/consent, retention/deletion controls, authenticated user identity and tenant isolation.

## Conversation memory consent
The widget includes an opt-in checkbox that is unchecked for a new browser tab. When checked, only redacted user messages and assistant text are retained in the current server process for up to 30 minutes (maximum 10 turns). The opt-in setting and opaque session token persist in that tab's `sessionStorage`; closing the tab removes them. When unchecked, requests are answered without prior-turn context. The server-side session key is a hash of the browser token, not an authenticated identity. This memory is volatile and is not durable across Render restarts or multiple instances. Do not use this public session memory for personal financial records, reports, filings or dashboard data.

### Opt-out behavior
Unchecking the memory option calls `POST /api/chat/session/clear`, removes the tab's consent and session token, and clears the matching in-process history. Requests made while unchecked do not load prior-turn context. Re-enable the unchecked consent box to start a new opt-in session.

## Current feature boundaries

- Retrieval is local lexical/IDF matching over source-linked chunks. It is not yet embeddings + vector search; do not describe it as dense-vector RAG.
- Responses are currently non-streaming JSON from an OpenAI-compatible chat-completions endpoint.
- Voice input uses browser `SpeechRecognition` where available. There is no server-side Whisper fallback in this branch; unsupported browsers can still type messages.
- Rate limiting is an in-process per-IP guard only. It is not distributed across multiple Render instances and the forwarded client IP header must be trusted only when set by your own reverse proxy.

## Production configuration notes

The repository privacy protocol says confidential financial/client data must go only to an approved paid API configuration with the applicable data-use terms. Do not use public/free consumer chatbot endpoints for sensitive customer data. Use a dedicated chatbot API key where possible.

## Run and test commands

```bash
npm install
npm run test:chatbot
npm run index:chatbot
npm start
``

Then open the deployed site and send a test request:
```bash
curl -X POST https://bookmyrecords-api.onrender.com/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"message":"What does Book My Records offer for GST compliance?"}'
``

The endpoint returns HTTP 503 until the model API environment variables are configured.
