# DeepSeek AI + PDF + Storage + Booking — Complete Flow Plan & Documentation

**Project:** Book My Records (`lotousyoga`) · **Date:** 17 Nov 2026 · **Mode:** research + config only. **Application code NOT changed** — यह review के लिए plan है।

**Research sources:** provider docs/homepage/docs/privacy/status (user-दिया गया URL), DeepSeek official API docs, independent model trackers (awesome-free-ai-coding, llmperks, freellmapi, infron), Cal.com/Calendly 2026 pricing & comparisons, Supabase/Vercel/Cloudflare/MongoDB free tiers, repo code + 70/70 test suite.

---

## IMPLEMENTATION STATUS — DONE (17 Nov 2026)

| Item | Status | Evidence |
|---|---|---|
| Verified owner key | **DONE** — `hms-` key accepted; `/v1/models` 200 and chat completion 200; invalid earlier tokens discarded | `.env` (gitignored) |
| ENV hygiene | **DONE** — `.gitignore` ignores `.env`; `.env.example` placeholders only; 0 key hits in docs | `git check-ignore .env` |
| Provider-agnostic AI | **DONE** — `api/checkup/ai.js`, `analyze.js` uses `callAiApi`, `health.js` reports `live_ai`/model | live test 15/15 |
| Report ID unified | **DONE** — generated once in handler, stamped on AI + synthetic + `_meta` | `analyze.js` |
| PDF | **DONE** — `api/checkup/pdf.js` (pdf-lib), full report, wrapped text, page numbers | PDF `%PDF-` 7.7 KB |
| Storage | **DONE** — `api/checkup/storage.js` local + Supabase REST adapters, idempotent | 14/14 + smoke |
| Submit / booking / notify | **DONE** — `submit.js`, `booking.js` (client + Cal.com webhook), `notify.js` (Resend/Telegram) | smoke test |
| Frontend | **DONE** — `checkup.js` persists report, shows PDF link only when `pdfUrl` exists, captures Cal postMessage; `checkup.html` consent copy + PDF block; `bmr-ds.css` styles | code + tests |
| Server routes | **DONE** — `server.js` loads `.env`, mounts 5 new endpoints, serves PDFs | smoke 6/6 |
| Tests | **DONE** — `verify_ai_flow.js` (14 offline / 15 with `--live`); all old suites still pass | m2 0, m3 29, m4 26, e2e 70 |
| Browser screenshot | **SKIPPED** — gstack browse needs one-time local build; HTTP + JS verification done instead | — |

**Live timing note:** the full structured report takes ~60-65 s on the free gateway; AI timeout set to 120 s with synthetic fail-open fallback.

---

## 1. Executive summary — सीधा जवाब

| प्रश्न | उत्तर |
|---|---|
| क्या दिया गया endpoint DeepSeek official है? | **नहीं।** `100milionseek.top/v1` एक **तीसरा free proxy/aggregator** है, DeepSeek का official base URL `api.deepseek.com` है। |
| क्या मॉडल असली है? | हाँ — `deepseek-v4.1-flash-free` कई providers पर free मिलता है; **official DeepSeek ID अलग है** (`deepseek-flash`, V4.1-Flash-1017)। |
| क्या key सही है? | **अनिश्चित** — आपने 2 tokens paste किए; provider docs key prefix `hms-…` बताते हैं, आपके tokens `oc_sk_…` / `28_…` से शुरू हैं। **Confirm करें।** |
| ENV में क्या जोड़ा? | `.env` (ignored) + `.env.example` (placeholders) + `.gitignore` expand — **कोई key किसी report/docs में नहीं लिखी गई**। |
| PDF कैसे? | **दो रास्ते:** यूज़र को मौजूदा `window.print()` → "Save as PDF" (0 cost); owner के लिए server-side **pdf-lib** से stored full-report PDF (private bucket)। |
| कहाँ store? | **Supabase** (Postgres record + private Storage PDF) — core `fetch` से चलेगा, dashboard में owner को तुरंत दिखेगा। MongoDB दूसरा विकल्प (नीचे comparison)। |
| Calendly या क्या? | **Cal.com रखें** — पहले से integrated है, free webhooks मिलते हैं, Calendly से ज़्यादा free value; सिर्फ `BOOKING_CREATED` webhook जोड़ना है। |
| Owner को कैसे पता चलेगा? | Supabase dashboard (`bookings`/`submissions` table) + **Resend email** + वैकल्पिक Telegram alert — तीनों एक ही `report_id` से जुड़े। |
| सब कितना बड़ा है? | ~3 नए files, **1 npm dependency (`pdf-lib`)**, ~5 env vars, 2 नए routes, 4 test suites पहले जैसे ही रहेंगे (70/70)। |
| सबसे बड़ा अभी का gap? | **0 persistence, 0 booking event capture, 0 stored PDF, consent copy "never stored" गलत हो जाएगी, test `verify_e2e.js:427` disk-write मना करता है**। |

> **सबसे महत्वपूर्ण चेतावनी:** दिया गया provider free, बिना SLA का तीसरा पक्ष है (OVHcloud Canada hosting), उसने 15 Nov 2026 को outage भी झेला। PII/DPDP वाले financial documents को production में भेजने से पहले owner को provider की reliability और data-transfer (Canada) Acceptable Use/DPDP standpoint से sign-off देना होगा।

---

## 2. Deep research — endpoint & model verification

### 2.1 जो URL आपने दिया (`https://100milionseek.top/v1`)

Provider की अपनी साइट के अनुसार:

| Item | Value |
|---|---|
| सेवा | "100milionseek" — free AI gateway, **100,000,000 tokens/day/account**, no card |
| Base URL | `https://100milionseek.top/v1` (OpenAI-compatible) |
| Chat endpoint | `POST /v1/chat/completions` |
| Auth | `Authorization: Bearer <key>` — docs में key prefix **`hms-…`**, env नाम `HMS_API_KEY` |
| Model ID | `deepseek-v4.1-flash-free` |
| Context / output | 198K tokens / 64K max output |
| Limits | 5 concurrent requests, 4 MB request body |
| Extras | JSON mode, streaming, tools; `GET /v1/models`, `/health`, `/api/status` |
| Quota headers | `x-quota-limit`, `x-quota-used`, `x-quota-remaining`, `x-quota-reset` |
| Errors | `429 daily_quota_exceeded`, `429 session_limit_reached`, `503 upstream_saturated`, `502 upstream_error`, `404 model_not_found` |
| Data claim | prompts/responses **not stored**; email + key hash + counters रखते हैं; hosting **OVHcloud Canada**; Cloudflare in front |
| Reliability | 15 Nov 2026 को ~92 मिनट outage (DB lookup overload), सब accounts को 10 reset vouchers |
| मेरी सीधी जाँच | `GET https://100milionseek.top/v1` → **404** (सामान्य — सिर्फ `/v1/models` और POST `/v1/chat/completions` ही मौजूद हैं) |

**निष्कर्ष:** URL एक **वैध OpenAI-compatible gateway** है, पर **DeepSeek official नहीं**। आपके paste किए गए दोनों tokens (values सिर्फ gitignored `.env` में रखे गए हैं, यहाँ नहीं लिखे गए) provider docs के `hms-` prefix से मेल नहीं खाते। हो सकता है कोई दूसरा gateway key हो या paste गलत हुआ हो। **Live call से पहले confirm करें।**

### 2.2 मॉडल `deepseek-v4.1-flash-free`

- Independent trackers के अनुसार DeepSeek V4.1 Flash **open-weight, reasoning/coding/tool-use सक्षम**, कई providers पर free: OpenCode Zen, NVIDIA NIM (`deepseek-ai/deepseek-v4.1-flash`), Alibaba DashScope (`deepseek-v4.1-flash`), Token Harbor, OrcaRouter, UnoRouter, BlazeAPI, और 100milionseek।
- **Official DeepSeek API** (api.deepseek.com) में current IDs `deepseek-flash` (V4.1-Flash-1017) और `deepseek-v4-pro` हैं; `deepseek-chat`/`deepseek-reasoner` 24 Jul 2026 को retire हो चुके हैं; official pricing ~$0.14/M cache-miss input, ~$0.28/M output (Flash)।
- `-free` suffix वाला ID gateway-विशेष है — **Official DeepSeek पर `deepseek-v4.1-flash-free` काम नहीं करेगा**; आपके gateway पर ही सही है।
- हमारे use-case (structured JSON report) के लिए JSON mode ज़रूरी है — gateway docs में "JSON mode" सूचीबद्ध है; schema validation पहले से `analyze.js:714-755` में है, इसलिए मॉडल की गलती पकड़ी जाएगी।

### 2.3 प्रभाव

1. Code को **provider-agnostic OpenAI-compatible client** बनाना है — base URL + model + key तीनों `.env` से आएँगे, ताकि कल official DeepSeek या दूसरे gateway पर बदलना सिर्फ 3 env lines का काम हो।
2. `AI_MOCK_MODE=true` रखा है (safe default) — जब तक आप लाइव key confirm नहीं करते, साइट synthetic report देती रहेगी (जैसे आज दे रही है)।
3. Medical/PII वाली सामग्री gateway भेजने से पहले DPDP sign-off ज़रूरी; gateway "not stored" कहता है पर वह **third-party processor** है, इसलिए consent copy को "we use an AI processor" कहना होगा।

---

## 3. ENV setup — मैंने क्या किया (सिर्फ config)

| File | परिवर्तन |
|---|---|
| `.gitignore` | पहले सिर्फ `_reference/` था — अब `.env`, `.env.*` (सिवाय `.env.example`), `.tmp-*`, `tmp*.js`, `_preview-icons.html`, `node_modules/` जोड़े गए। `git check-ignore` से verify: `.env` **ignored**, सिर्फ `.env.example` track होगा। |
| `.env.example` (नया) | सिर्फ placeholders — AI base/model/key, Cal.com, Supabase, Resend/Telegram, runtime। **कोई असली key नहीं**। |
| `.env` (नया, ignored) | आपके paste किए गए values: `AI_BASE_URL=https://100milionseek.top/v1`, `AI_MODEL=deepseek-v4.1-flash-free`, `AI_API_KEY=<pasted token #1>`, `AI_API_KEY_ALT=<pasted token #2>`, `AI_MOCK_MODE=true` (safe)। बाकी सब placeholders। |

> **आपको करना है:** (a) confirm करें कि कौन सा token सही है (gateway dashboard `/dashboard` में देखें); (b) गलत token हटाएँ; (c) लाइव verify होने पर `AI_MOCK_MODE=false` करें। मैंने जानबूझकर docs/report में **कोई भी key value नहीं लिखी**।

### Env vars — अंतिम सूची (code को ये पढ़ने होंगे)

```
AI_BASE_URL, AI_MODEL, AI_PROVIDER, AI_API_KEY, AI_MOCK_MODE   # analyze + health
CAL_EVENT_SLUG, CAL_WEBHOOK_SECRET                              # booking webhook
STORAGE_ENABLED, STORAGE_DRIVER, SUPABASE_URL, SUPABASE_SERVICE_KEY,
SUPABASE_BUCKET, PDF_OUTPUT_DIR                                # submit + pdf
RESEND_API_KEY, OWNER_EMAIL, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID  # notification
PORT, NODE_ENV                                                 # runtime
```

> **Server.js**: Node 20+ में `--env-file=.env` flag से बिना किसी dependency के env load हो सकता है; Vercel पर ये vars dashboard में डालेंगे। कोई `dotenv` dependency ज़रूरत नहीं।

---

## 4. AI flow — अभी कैसा है, कैसा होगा (provider-agnostic)

### 4.1 वर्तमान (as-is)

```
checkup.html form → checkup.js:718-755 POST /api/checkup/analyze
   → analyze.js:840 parseRequestBody  → :843 validateCheckupPayload
   → :410-423 evaluateInternalCriteria (streamlined: q1..q25 internal)
   → :856 calculateHealthScore (deterministic — AI कभी score नहीं बदलता)
   → :134-171 sanitizePii
   → :858-864 mock? → :900-911 synthetic  |  live? → :866-875 buildGeminiPrompt + callGeminiApi
   → :796 data.candidates[0].content.parts[0].text → JSON.parse
   → :714-755 validateReportSchema → :877-887 AI scores overwrite with deterministic
   → :913-919 _meta → :922 response JSON
   → checkup.js:782 renderReport → :784-790 showAnalysisView('report') + initCalBooking()
   → :1239-1251 window.print() (सिर्फ user PDF, कोई store नहीं)
```
**Gemini-विशेष जगहें:** `analyze.js:761` URL (key query string में), `:763-775` `contents`/`generationConfig`, `:783` headers, `:796` response path, `:860-864` `GEMINI_API_KEY`, `:33` health में `live_gemini` string।

### 4.2 प्रस्तावित (OpenAI-compatible, provider-agnostic)

```
POST /api/checkup/analyze (request shape वही — frontend कोई बदलाव नहीं)
   → parse → validate → score → PII   (वही)
   → env: AI_BASE_URL + AI_API_KEY + AI_MODEL + AI_MOCK_MODE
   → callAi():
       POST ${AI_BASE_URL}/chat/completions
       headers: Authorization: Bearer ${AI_API_KEY}, Content-Type: application/json
       body: { model: AI_MODEL, temperature: 0.1, response_format: {type:'json_object'},
               messages: [ {role:'system', content: systemPrompt},
                           {role:'user', content: buildReportPrompt(...)} ] }
       timeout: 20000ms; AbortController
       response: data.choices[0].message.content → JSON.parse
   → validateReportSchema (वही) → deterministic score override (वही)
   → report_id handler में एक बार generate → synthetic + AI दोनों पर stamp
   → response + NEW: POST /api/checkup/submit (frontend से) → record + PDF + notify
```

**Exact code changes:**

| File | Lines | What |
|---|---|---|
| `api/checkup/analyze.js` | 632-709 | `buildGeminiPrompt` → `buildReportPrompt` + system prompt (छह weight strings **वैसे ही रखें** — `verify_m4.js:231-239` उन्हें assert करता है) |
| | 760-810 | `callGeminiApi` → `callAi`: URL/body/headers/response path बदलें; 15s → 20s timeout |
| | 858-864 | `GEMINI_API_KEY` → `AI_API_KEY` (+ `AI_BASE_URL`, `AI_MODEL`); `AI_MOCK_MODE` वही रखें |
| | 891, 916 | engine string → `deepseek-v4.1-flash-free`; `compliance` copy में AI processor का उल्लेख |
| | 451, 672 | `report_id` को handler में एक बार बनाकर दोनों paths में pass करें (join key) |
| `api/checkup/health.js` | 25, 33 | mock decision `AI_API_KEY`; string `synthetic_mock` / `live_ai` (version `1.0.0` रखें) |
| `verify_m2/e2e` | — | **कोई बदलाव नहीं** (GEMINI strings assert नहीं होते) |
| `verify_m3.js` | 341 | `AI_MOCK_MODE` वही नाम → कोई बदलाव नहीं |
| `verify_m4.js` | 231-239 | weight strings वही रखें → कोई बदलाव नहीं |

---

## 5. PDF plan — कहाँ बनेगा, कब दिखेगा, कहाँ store होगा

### 5.1 दो paths (दोनों रखें)

| Path | क्या | कहाँ | क्यों |
|---|---|---|---|
| **A. User-facing (तुरंत)** | `window.print()` + `@media print` | `checkup.js:1239-1251`, `bmr-ds.css` print rules | 0 dep, 0 cost, 70/70 tests intact; user "Save as PDF" चुनता है |
| **B. Stored artifact (नया)** | `pdf-lib` server-side, full report JSON से | नया `api/checkup/pdf.js` + `/api/checkup/report/:id/pdf` | owner को actual file चाहिए — store + link + download |

### 5.2 कब दिखाएँ ("जब PDF हो, तभी show करें")

- `renderReport()` (`checkup.js:860-1052`) में PDF button **hidden** रखें; सिर्फ जब `/api/checkup/submit` response में `{ pdfUrl }` आए, तब `elements.pdfLink.hidden = false` करके `href=pdfUrl` सेट करें (signed URL or `/api/checkup/report/:id/pdf`)।
- और UI गating पहले से है (`#report-locked`, `updateLockedState()` `checkup.js:830-857`) — PDF link उसी gated area के अंदर रखें ताकि partial report वाला user full PDF न देखे।
- Stored PDF **full report** का होगा (सभी गहराई वाली जानकारी + disclaimer); user को preliminary/gated हिस्सा पहले से दिखता है — ये design docs (AI_REPORT_DESIGN.md) के अनुरूप है।

### 5.3 PDF content & filename

```
BMR-<YYYYMMDD>-<reportId>.pdf
Header  : Book My Records — Business Health Report
Page 1  : meta (company, industry, turnover, date, report_id) + overall score + risk band
Page 2+ : pillar scores, executive summary, strengths, gaps, observations, risks,
          30/60/90 plan, missing info, consultation agenda, disclaimer
Footer  : report_id + page numbers + "Preliminary — subject to consultant review"
```
> **Gotcha:** pdf-lib के standard fonts में `₹` (U+20B9) नहीं होता — PDF text में `Rs.` लिखें या fontkit+custom font जोड़ें (एक extra dep)।

---

## 6. Storage plan — कहाँ store करें (MongoDB या?)

### 6.1 Comparison (2026 free tiers)

| Option | Record | PDF file | Owner view | Effort | Verdict |
|---|---|---|---|---|---|
| **Supabase** (Postgres + Storage) | ✅ full JSON | ✅ private bucket + signed URL | ✅ **built-in table editor + file browser** | medium — REST via `fetch`, no SDK | **Recommended primary** |
| MongoDB Atlas M0 | ✅ doc shape perfect | ❌ कोई file storage नहीं | Atlas UI (records only) | high — driver dep | secondary; PDF के लिए दूसरी जगह चाहिए |
| Vercel Blob | metadata only | ✅ 1 GB free | file browser, no query | low | fallback for PDF bytes |
| Cloudflare R2 | ❌ | ✅ 10 GB, zero egress | ❌ custom UI | medium-high | only if volume बढ़े |
| SQLite / filesystem | ✅ local | ✅ local | ❌ | low | **Vercel पर reads-only FS** → data vanish; local dev only |
| Formspree/Formsubmit | email only | ❌ | inbox | low | primary record नहीं — अलग हो जाएगा |

**Recommendation: Supabase** — एक ही जगह record + PDF + owner dashboard; core `fetch` से REST calls, कोई SDK dependency नहीं; RLS + private bucket + short-lived signed URLs DPDP के अनुकूल। MongoDB तभी चुनें अगर आपका टीम-first choice हो — तब PDF के लिए Vercel Blob/ R2 अलग जोड़ना होगा।

### 6.2 Data model (एक submission = एक record)

```json
{
  "report_id": "BMR-20261117-A1B2C3",
  "created_at": "2026-11-17T...",
  "status": "report_ready | booked | completed",
  "submission": { "company_name", "contact_name", "contact_email", "contact_phone",
                  "industry", "turnover_band", "notes", "dpdp_consent_at" },
  "document": { "filename", "size", "type", "stored_path": null },  // file RAM-only
  "report": { /* पूरा BusinessHealthReport JSON — 11 root keys */ },
  "scores": { "overall_score", "risk_band" },
  "pdf": { "path": "bmr-reports/BMR-...pdf", "url": "<signed>", "generated_at": "..." },
  "booking": { "cal_booking_uid": null, "start_time": null, "booked_at": null,
               "consultant": null },
  "notifications": { "owner_notified_at": null, "telegram_sent_at": null }
}
```
- `report_id` **UNIQUE** → idempotent: दो बार submit = एक record, एक PDF, एक email।
- PII: `sanitizeObjectPii` (`analyze.js:935` export) reuse करें; contact PII अलग, restricted column में; PDF में contact phone/email **ना** डालें (सिर्फ company + report_id)।
- **Consent**: `checkup.html:284` का "never stored" वाला copy **गलत हो जाएगा** — उसे बदलकर "report and contact details are stored securely for consultant review; documents are processed in memory" कहना होगा (DPDP-specific purpose + retention)। Test में `DPDP Act 2023` literal बनाए रखें।

### 6.3 File structure

```
api/checkup/
├── analyze.js          # existing — only AI-provider swap + report_id stamp
├── health.js           # existing — strings
├── submit.js           # NEW: validate → sanitize → INSERT → PDF → notify
├── pdf.js              # NEW: pdf-lib Buffer from report JSON
├── booking-webhook.js  # NEW: verify signature → UPDATE record → notify owner
└── storage.js          # NEW: Supabase REST adapter (fetch only)
storage/reports/        # local dev fallback (gitignored)
```

---

## 7. Owner को कैसे पता चलेगा — booking & notification

### 7.1 Booking tool decision: **Cal.com रखें**

2026 research (Cal.com pricing, Calendly pricing, Cal.com vs Calendly comparisons):

| Factor | Cal.com (current) | Calendly |
|---|---|---|
| Free plan | 1 user, **unlimited links/calendars/event types**, email+SMS notifications, 100+ integrations | **1 event type, 1 calendar**, branding removal paid |
| Webhooks | **Free plan पर BOOKING_CREATED webhooks** ✅ | Free पर अब webhooks (rate-limited) — पर history में paid-only रहा |
| Hosted API v2 | Paid (free users self-hosted Cal.diy से API) | Standard+ |
| Embed | inline/pop-up — **पहले से implemented** (`checkup.js:1099-1131`) | iframe/widget, rigid |
| Prefill | name/email/phone/report_id **पहले से notes में भेज रहे हैं** (`checkup.js:1060-1107`) | URL params |
| Self-hosting | Cal.diy (MIT fork, personal/non-production) | ❌ |
| India/polish | hosted, no card | longer-refined UI |

**निर्णय:** Cal.com ही रखें — बदलने का cost/benefit नकारात्मक है (4 test strings टूटेंगे, prefill दोबारा बनाना होगा, कोई नया फायदा नहीं)। सिर्फ **webhook जोड़ें**:

```
Cal.com BOOKING_CREATED → POST /api/checkup/booking-webhook
   → verify CAL_WEBHOOK_SECRET (HMAC/signature)
   → notes string से report_id निकालें (आज वहीं भेज रहे हैं)
   → Supabase UPDATE Status='booked', booking.uid, start_time
   → Resend owner email + Telegram fallback
```

### 7.2 Notification (owner alert)

| Option | Free | Deps | Verdict |
|---|---|---|---|
| **Resend REST** (`fetch`) | 3,000/mo, 100/day | 0 | **Primary** — 1 HTTP call, env key |
| Telegram bot webhook | free | 0 | **Fallback instant ping** |
| Brevo | 300/day | REST से 0, SMTP से nodemailer | alternate |
| Gmail SMTP | 500/day | `nodemailer` dep | avoid |
| Formspree/Formsubmit | 50/mo | 0 | record Supabase से अलग हो जाएगा — avoid |

**Email में क्या भेजें (PII-safe):** report ID, company, score band, booking time, signed admin link — **PDF attach नहीं, कोई raw notes नहीं**।

### 7.3 Owner view — वर्तमान और भविष्य

- **v1 (zero code):** Supabase **Table Editor** = सारी submissions/booking status; **Storage browser** = PDFs। Owner को dashboard URL दे दें — कोई admin page बनाने की ज़रूरत नहीं।
- **v2 (optional):** `admin.html` — report_id/search/filter + PDF preview + status change; SRS Vision A का admin panel यहीं से शुरू हो सकता है (पर ये अलग scope है)।

---

## 8. End-to-end journey — user और owner

### 8.1 User (कोई भी visitor)

1. `index.html` teaser → `checkup.html` (Nav पर Health Checkup **सिर्फ 2/16 पेजों में है** — main report §4 H3; इसे सब पेजों में जोड़ना होगा)।
2. Form भरता है (company, contact, industry, turnover, notes), DPDP consent देता है, PDF upload करता है (optional)।
3. POST `/api/checkup/analyze` → AI report (या mock fallback) → gated report UI (`report-locked` सुरक्षा) दिखता है।
4. **NEW:** POST `/api/checkup/submit` → record + PDF → जब `pdfUrl` आए, तभी "Download full report (PDF)" link दिखेगा (पहले hidden)।
5. "Discuss with a consultant" → Cal.com inline widget (पहले से prefilled) → slot book करता है → Cal.com **BOOKING_CREATED webhook** → record `status=booked` हो जाता है → owner को alert।
6. User को success state + report ID + PDF link दिखता है; retake/print वही रहते हैं।

### 8.2 Owner (आप)

1. Telegram/Resend पर तुरंत ping: "New booking — BMR-2026-… — Company — ₹band — slot"।
2. Supabase dashboard खोलें → `submissions` table में पूरा record + report JSON + `status=booked` + booking time।
3. Storage bucket से PDF खोलें (signed URL) → consultant review → status `completed` करें (v2 UI या manually)।

### 8.3 "प्रति user एक बार" — idempotency

- `report_id` UNIQUE; submit endpoint upsert/on-conflict-do-nothing; PDF filename = report_id; webhook उसी report_id पर update।
- इससे दोहरी clicking, reload, या Cal.com retry से duplicate record/email नहीं बनते।

---

## 9. Server / runtime / size / cost

### 9.1 Local

```
node --env-file=.env server.js 8765
# server.js:18 PORT env, :142 127.0.0.1 bind, :62 CORS * (production में restrict करें)
# :76-98 analyze/health routes; नए routes :76-98 के पीछे mirror करें
```
### 9.2 Production (Vercel assumed by docs)

- `api/checkup/*.js` serverless handlers वही रहते हैं; नए 3 handlers जोड़ें; `.env` vars Vercel dashboard में; env file deploy नहीं होती।
- **Dependency footprint:** `package.json` सिर्फ `pdf-lib` (~179 KB gzip, zero transitive deps) — CommonJS (`require`) रखें; Puppeteer reject (Chromium 170–280 MB > Vercel 250 MB limit)।

### 9.3 "कितना छोटा है / कितना run करेगा"

| माप | अनुमान |
|---|---|
| नया कोड | ~3 files × 100-200 lines = ~400-500 LOC |
| Dependencies | 1 (`pdf-lib`) |
| Env vars | ~16 (सिर्फ 4 AI + 2 Cal + 6 storage + 3 notify ज़रूरी) |
|PDF size | ~80-200 KB/report (text-only) |
| API calls/submission | 1 analyze + 1 submit + 1 Supabase insert + 1 Storage put + 1 email + 1 webhook update = ~6 |
| Gemini/Gateway cost | 100M tokens/day free gateway — practical usage ~5-15K tokens/report → रोज़ाना सैकड़ों submissions तक free |
| Supabase free | 500 MB DB + 1 GB storage → हज़ारों records/PDFs; 1 week idle पर pause (first requestslow) |
| Resend free | 3,000/mo → ~100/दिन तक notification निश्चिन्त |
| Scaling bottleneck | gateway 5 parallel requests; वर्तमान volume में कोई issue नहीं; ज़रूरत पर paid/official DeepSeek पर switch (env-only change) |

---

## 10. क्या gap है / क्या missing है / क्या नहीं हुआ

| # | Gap | Severity | Fix phase |
|---|---|---|---|
| G1 | AI provider Gemini hardcoded; DeepSeek env में है पर code उसे पढ़ता नहीं | Critical | P1 |
| G2 | Key ambiguity (2 tokens, prefix mismatch) — live call verify नहीं | Critical | owner decision |
| G3 | 0 persistence — सब RAM में; owner को कुछ दिखता नहीं | Critical | P2 |
| G4 | 0 stored PDF; सिर्फ `window.print()` | High | P2 |
| G5 | Cal.com booking event capture नहीं — किसने book किया पता नहीं | Critical | P2 |
| G6 | Consent copy "files never stored" — retention के साथ गलत | High (DPDP) | P1 |
| G7 | Test `verify_e2e.js:427` `analyze.js` में fs.write मना करता है | Medium | storage को अलग file में रखें |
| G8 | `report_id` 3 जगह अलग format (451/672/548) — join key अस्थिर | Medium | handler में एक बार |
| G9 | Health/analyze mock decision अलग; health `live_gemini` कह सकता है जबकि fallback चल रहा | Medium | unify |
| G10 | `CAL_EVENT_LINK` docs में है, code hardcoded slug (`checkup.js:1101`) | Low | env से पढ़ें |
| G11 | Health Checkup nav 14/16 pages में गायब (main report) | High (conversion) | P0 |
| G12 | Contact form backend नहीं (main report) — lead capture 0 | Critical | P0 |
| G13 | तीसरा gateway = third-party processor; DPDP/cross-border sign-off नहीं | High | owner decision |
| G14 | Free provider no SLA; 15 Nov outage 발생ा | Medium | fallback policy + official DeepSeek option |

---

## 11. Implementation phases + acceptance criteria

### P0 — safety & decisions (owner)
- [ ] Confirm सही API key; गलत token `.env` से हटाएँ; `AI_MOCK_MODE` policy तय करें।
- [ ] Gateway (third-party, Canada) use करने का DPDP sign-off — या official `api.deepseek.com` (paid) चुनें।

### P1 — AI swap (≈0.5–1 दिन)
- [ ] `analyze.js`: OpenAI-compatible call, env config, unified mock decision, single report_id, engine string; prompt weight strings **वैसे ही**।
- [ ] `health.js`: strings + mock decision; `verify_m3/m4/e2e` चलाएँ — **count 29/26/70 वही रहने चाहिए**।

### P2 — persistence + PDF + booking (≈2–3 दिन)
- [ ] Supabase project + private bucket; `.env` placeholders भरें; `storage.js`, `pdf.js`, `submit.js`, `booking-webhook.js`।
- [ ] `server.js` में routes; `checkup.js` में submit fetch + PDF link gating; consent copy update; Cal webhook secret।
- [ ] `verify_e2e.js:427` constraint respect (storage अलग file में)।

### P3 — UX + polish (≈0.5–1 दिन)
- [ ] Health Checkup nav सब 16 pages में; contact form backend; PDF link CSS (`bmr-ds.css`)।

### Acceptance criteria
- [ ] Live AI call सफल (mock off), report schema validate, score deterministic वही; errors पर synthetic fallback + user को report मिलता रहे (fail-open)।
- [ ] हर submission का एक record + एक PDF + एक owner email; duplicates न हों।
- [ ] PDF सिर्फ तब दिखे जब `pdfUrl` मिले; gated report rule बनी रहे।
- [ ] Cal.com बुकिंग पर record `status=booked` + owner alert; `report_id` से join हो।
- [ ] `node verify_m2.js` 0 errors · `verify_m3.js` 29/29 · `verify_m4.js` 26/26 · `verify_e2e.js` 70/70 · `audit-assets.py` 0 missing।

---

## 12. आपसे confirmation चाहिए (2 मिनट)

1. **कौन सा token सही है?** दोनों `.env` में हैं — गलत हटा दूँ?
2. **Third-party free gateway acceptable है** PII/AI processing के लिए, या official DeepSeek (paid) पर जाना है? (Code दोनों के लिए वहीसेटिंग काम करेगा — सिर्फ env बदलना होगा।)
3. **Storage:** Supabase ठीक है या MongoDB चाहिए? (MongoDB चुनने पर PDF के लिए अलग file store जोड़ूँगा।)
4. **PDF किसके लिए?** — Stored full PDF + उसी का link; क्या user को partial/gated PDF भी चाहिए? (मेरा सुझाव: stored full PDF सिर्फ owner; user को print-to-PDF वही रहे।)
5. **Cal.com रखें?** (मेरा सुझाव: हाँ + webhook)।

> मैंने **कोई application code नहीं बदली** — सिर्फ `.gitignore`, `.env`, `.env.example` और ये documentation। उपरोक्त जवाब मिलते ही P1–P3 implement कर दूँगा।

---

## Appendix — research artifacts (evidence)

```
provider  : 100milionseek.top/home, /docs, /privacy, /status — 100M tokens/day,
            hms- key prefix, 198K ctx, 64K out, OpenAI-compatible, OVHcloud Canada,
            15 Nov 2026 outage note. GET /v1 → 404 (expected).
model     : deepseek-v4.1-flash-free listed free at OpenCode Zen, NVIDIA NIM,
            DashScope, Token Harbor, OrcaRouter, UnoRouter, BlazeAPI (independent trackers).
official  : api.deepseek.com — deepseek-flash (V4.1-Flash-1017), deepseek-v4-pro;
            legacy chat/reasoner retired 24 Jul 2026.
booking   : Cal.com Free = unlimited links/events + free webhooks; Calendly Free = 1 event type.
storage   : Supabase 500MB DB/1GB storage; MongoDB M0 512MB no files; Vercel Blob 1GB;
            R2 10GB; Vercel FS read-only (no local persistence).
pdf       : pdf-lib 0 deps ~179KB gzip; pdfkit ~1MB; Puppeteer 170-280MB (Vercel 250MB limit).
tests     : verify_e2e.js:427 blocks fs writes in analyze.js; weight strings in verify_m4.js:231-239.
```



