# Stack Decision Report — Free Tools, Deployment, Email, Booking, Storage

**Date:** 17 Nov 2026 · **Context:** BMR checkup → report → consultation booking → PDF + owner data
**Method:** 2026 vendor docs/pricing/checks + current repo capabilities + owner constraints (free tools, temporary Render or small VPS, minimum reliable setup)

---

## 1. सीधा निर्णय (TL;DR)

| निर्णय | मेरी सिफारिश | क्यों |
|---|---|---|
| Hosting | **छोटा VPS (~$4-5/mo)** — Hetzner CX21 / Contabo जैसा। Render free सिर्फ temporary demo के लिए ठीक है, production नहीं। | Render free 15 मिनट पर सोता है + ~1 मिनट wake; 60-65s की AI कॉल के साथ ये खतरनाक है। ephemeral filesystem = PDF/data गायब; free Postgres 30 दिन में expire; SMTP ports बंद। VPS पर सब एक जगह, हमेशा on। |
| Database + PDF | **VPS पर SQLite file + PDF folder** (एक ही जगह)। अगर hosted free चाहिए तो **MongoDB Atlas M0**, Supabase नहीं। | Supabase free 1 सप्ताह idle पर pause; इस्तेमाल हमें 5% features का है (सिर्फ 1 collection + file)। Mongo सीधा document store है, 30 दिन तक सहता है, resumable। |
| Email | **Resend free (3,000/mo, 100/day)** primary + **Telegram bot** fallback। | Resend बिना approval API से तुरंत काम करता है और हमारा code पहले से REST use कर रहा है। Render से SMTP ports बंद हैं, इसलिए SMTP चुनना गलत होगा। |
| Booking | **Cal.com free रखें + `BOOKING_CREATED` webhook**। Calendly / Cal.diy / custom form नहीं। | पहले से embedded + prefilled, unlimited events, free webhooks, Google Calendar sync। Calendly free सिर्फ 1 event type; Cal.diy vendor-खुद "non-production" कहता है; custom form में calendar-conflict + reminders खुद बनाने पड़ेंगे। |
| Data कहाँ | **एक structured record (DB) + PDF file उसी स्टोर में**, owner को signed link ईमेल + dashboard। Excel या सिर्फ ईमेल **नहीं**। | Excel में concurrency/audit/security नहीं; mail-only record बिखर जाता है, query नहीं होती। |
| PDF timing | **सिर्फ booking के बाद** — अब implement हो गया है। | Owner की नई requirement; submit पर सिर्फ data, booking event पर PDF generate + store + link। |

---

## 2. Hosting: Render free vs VPS (research)

| Factor | Render Free | Render paid ($7/mo) | Small VPS ($4-5/mo) |
|---|---|---|---|
| Idle | 15 मिनट बाद spin-down, ~1 मिनट wake | always on | always on |
| Filesystem | ephemeral — spin-down/redeploy पर सब गायब | disk attach $0.25/GB | persistent disk |
| Free Postgres | 1 GB, **30 दिन में expire**, 14 दिन grace, फिर delete | $6/mo, expiry नहीं | SQLite locally, कोई expiry नहीं |
| SMTP ports | **25/465/587 blocked** | blocked | open |
| 750 hours/mo | 1 service ~720h, दूसरी service सब suspend | लागू नहीं | लागू नहीं |
| लेना कब | सिर्फ demo/URL दिखाने के लिए | zero-ops चाहिए तो | **minimum + reliable + सब एक जगह** |

**निष्कर्ष:** client को "free tool" चाहिए तो Render free से शुरुआत ठीक है, पर QR/AI report वाली real lead में visitor को ~1 मिनट loading दिखेगा और data टिकेगा नहीं। इसलिए **एक छोटा VPS ही सही "minimum + reliable" जवाब है**। अगर VPS न लें तो Render $7/mo web service + external DB लेना होगा।

---

## 3. Supabase के alternatives (2026 free, research)

| Service | Engine | Free storage | Catch | हमारे काम के लिए |
|---|---|---|---|---|
| **MongoDB Atlas M0** | Document | 512 MB | 30 दिन zero-connection पर pause, resumable; no backups | **सबसे सीधा Supabase alternative** — हमें सिर्फ 1 collection चाहिए, auth/storage की ज़रूरत नहीं |
| **Neon** | Postgres | 1 GB/project | 5 मिनट idle पर compute scale-to-zero, first query ~350ms; expire नहीं | Supabase से बेहतर अगर Postgres चाहिए; file storage नहीं |
| **Supabase** | Postgres + auth + storage | 500 MB DB + 1 GB files | **1 सप्ताह idle पर pause** | ज़्यादा features, हमاری ज़रूरत से ज़्यादा |
| **Cloudflare D1** | SQLite | 500 MB/DB, 5 GB total | 100k rows written/day, Workers-centric | तेज़ पर अलग file store चाहिए |
| **Turso** | SQLite-compatible | 5 GB | 10 दिन idle पर archive; vendor Supabase में जा रहा | storage ज़्यादा पर future uncertain |
| **Render Postgres** | Postgres | 1 GB | **30 दिन में delete** | temporary demo मात्र |
| **SQLite on VPS** | File | disk जितना | सिर्फ localhost | **सबसे छोटा + reliable, एक जगह data+PDF** |

**मेरा सुझाव:** VPS लेने पर **SQLite + PDF folder** (कोई external DB नहीं, कोई pause नहीं, कोई per-service limit नहीं)। hosted-free चुनने पर **MongoDB Atlas M0** — `storage.js` में एक `mongodb` adapter जोड़ना होगा (एक dependency)। Supabase adapter पहले से बना है, लेकिन 1-सप्ताह pause की वजह से मैं उसे primary नहीं रखूँगा।

> ध्यान: OpenAI-जैसे gateway की तरही ये free DB भी "client को free" वाले promise पर निर्भर हैं। Free tier बदल सकते हैं; VPS पर data आपके अपने disk में रहता है — यही reliable way है।

---

## 4. Email: Resend vs free SMTP (research)

| Provider | Free | Daily cap | Approval | Verdict |
|---|---|---|---|---|
| **Resend** | 3,000/mo | 100/day | **नहीं** (domain verify के बाद तुरंत) | **Primary — पहले से wired** |
| Mailjet | 6,000/mo | 200/day | domain validation | ज़्यादा volume चाहिए तो |
| Brevo | ~9,000/mo | 300/day | **हाँ, account approval** | branding + approval |
| SMTP2GO | 1,000/mo | 200/day | account review | कम volume |
| Gmail SMTP | 500/day | — | app password | personal mailbox risk |
| SendGrid | **कोई free plan नहीं** (60-day trial) | 100/day | — | reject |

**मेरा सुझाव:** **Resend रखें**। Owner को सिर्फ 2 ईमेल चाहिए (new assessment, booking+PDF link) — 100/day से कहीं ज़्यादा है। साथ **Telegram bot webhook** free fallback जोड़ें ताकि ईमेल न आए तो भी तुरंत पता चले। **SMTP न चुनें** क्योंकि Render पर ports block हैं और VPS पर भी SMTP इन्फ्रा खुद संभालनी पड़ती है। PDF ईमेल में attach **नहीं** — सिर्फ signed/secure link (PII-safe)।

---

## 5. Booking: किस पे book करवाना चाहिए (research)

| Option | Free reality | हमारे लिए |
|---|---|---|
| **Cal.com hosted Free** | 1 user, unlimited links/events/calendars, email+SMS notifications, **webhooks free**, Google Calendar sync, Stripe/PayPal | **सही choice** — पहले से `checkup.js` में inline embed + prefill (name/email/phone/Report ID) है, सिर्फ webhook जोड़ना बाकी |
| **Calendly** | Free सिर्फ **1 event type + 1 calendar**, branding; webhooks अब free पर rate-limited | बदलने का कोई फायदा नहीं, 4 test strings टूटेंगे |
| **Cal.diy self-host** | MIT fork, लेकिन vendor खुद "personal, non-production use only" कहता है; Postgres + OAuth apps + backups + updates खुद संभालने पड़ेंगे | deploy/ops बोझ, client के "minimum" लक्ष्य के उल्ट |
| **खुद का booking form** | free पर बनाना तो आसान है, पर calendar conflicts, timezone, reminders, reschedule/no-show सब खुद लिखने पड़ेंगे | सिर्फ तब चुनें जब Cal.com account काम न करे; हमारे पास client fallback पहले से है |

**निर्णय:** **Cal.com free + `BOOKING_CREATED` webhook → हमारे `/api/checkup/booking-webhook`**। इससे:
1. visitor को familiar, smooth scheduling मिलता है;
2. Google/Outlook calendar sync Cal.com संभालता है;
3. booking का data **हमारे स्टोर में** आ जाता है (webhook → record update → PDF → owner alert) — यानी "एक जगह" वाला लक्ष्य पूरा;
4. client-side postMessage सिर्फ fallback है (webhook authoritative)।

Webhook register करने के लिए Cal.com dashboard → Settings → Developer → Webhooks → URL: `https://<your-host>/api/checkup/booking-webhook`, trigger: `Booking Created`, secret = `CAL_WEBHOOK_SECRET`।

---

## 6. Data कहाँ store करें — Excel / mail / DB?

| Option | नतीजा |
|---|---|
| **Excel/Google Sheet** | एक साथ कई bookings पर rows clash, कोई validation/audit नहीं, PDF attach करना मुश्किल, PII सुरक्षा नहीं। Client को "minimum" चाहिए तो भी ये गलत minimum है। |
| **सिर्फ ईमेल** | हर booking एक अलग mail = record बिखरा, खोजना/फ़ॉलो-अप करना असंभव, mailbox quota, PII inbox में। |
| **DB record + PDF file** | सही: query, status timeline, idempotency, signed PDF link, owner dashboard, DPDP deletion path — सब संभव। |

**हमारा तैयार data model** (`api/checkup/storage.js`): `report_id` (unique) → `submission` (sanitized PII), `report` (पूरा JSON), `scores`, `pdf {stored, filename, url, generated_at}`, `booking {uid, start_time, email, source, booked_at}`, `status: report_ready → booked`।

> **PDF सिर्फ booking पर:** submit = सिर्फ data (`status=report_ready`, `pdf.stored=false`) → booking event = PDF generate + store + `status=booked` + link। ये अब code में है और smoke test से verify (नीचे)।

---

## 7. अभी क्या implement है (PDF-on-booking सहित)

सभी बदलाव किए गए और टेस्ट किए गए:

- `api/checkup/submit.js` — अब PDF **नहीं** बनाता; सिर्फ record store करता है, response में `pdfPending:true`, `pdfAvailable:false`।
- `api/checkup/booking.js` — `applyBooking()` अब lazily PDF generate + save + `markPdfStored()` + owner alert में link; webhook और client fallback दोनों एक ही रास्ते से; `pdfInFlight` Set + record re-check से double generation रुकी।
- `api/checkup/storage.js` — नया `markPdfStored()` atomic claim; `updateBooking()` अब `already_booked` लौटाता है (duplicate email रोकने के लिए)।
- `api/checkup/notify.js` — submission mail में "PDF after booking" कहता है; booking mail में सिर्फ तब link जब PDF बनी हो।
- `assets/js/checkup.js` — PDF link booking के बाद ही reveal; Cal.com postMessage के response से link; 3s polling fallback (`/api/checkup/report/{id}`) अगर postMessage न आए; resetWizard में timer cleanup।
- `verify_ai_flow.js` + `scripts/smoke-ai-flow.js` — नए contract के लिए update।

**ताज़ा verify (इसी सेशन में):**
```
npm test        → 14/14 pass (m2 0, m3 29, m4 26, e2e 70 भी pass)
smoke           → submit: pdfAvailable=false pdfPending=true
                  booking: pdfAvailable=true
                  PDF: 7,755 bytes, %PDF-
                  record: status=booked, pdf.stored=true
```

---

## 8. अगला कदम — आपको सिर्फ 1 चुनना है

| विकल्प | मैं क्या करूँगा |
|---|---|
| **A. VPS (मेरी सिफारिश)** | `storage.js` में SQLite adapter जोड़ूँगा (local PDF folder के साथ), `server.js` को always-on service के लिए prepare करूँगा, `.env.example` को VPS-ready बनाऊँगा। खर्च ~$4-5/mo, data आपके disk पर। |
| **B. MongoDB Atlas M0 (free)** | `mongodb` dependency + adapter जोड़ूँगा; PDF के लिए VPS disk या R2/Vercel Blob अलग चाहिए। 512 MB, 30 दिन idle pause। |
| **C. Render free (temporary demo)** |existing local adapter ही काम करेगा पर spin-down/ephemeralFS की वजह से data टिकेगा नहीं — सिर्फ URL दिखाने के लिए ठीक। |
| **D. Supabase (पहले से बना है)** | credentials भरते ही production पर चल जाएगा; 1-सप्ताह pause स्वीकार करें। |

Email और booking के लिए:**
- Resend key + verified domain + `OWNER_EMAIL` भरें (Telegram optional) → owner को तुरंत alert।
- Cal.com dashboard में ऊपर बताया webhook register करें → real booking पर PDF + data हमारे स्टोर में मिल जाएँगे।

> मैंने **render/VPS/Mongo credentials के बिना production config नहीं बदली** — सिर्फ code और docs तैयार हैं। आप A/B/C/D चुनें, उसी हिसाब से adapter + deploy config पूरा कर दूँगा।

---

## Appendix — research sources (checked 2026)
Render free docs/pricing · free-database comparison (Stackwrite, zeroraised, freetiertracker, actualdatabase) · Resend quotas · free transactional email comparison (zeroraised, markrelay, sendlayer) · Cal.com pricing/webhooks FAQ · cal.diy docs · independent Cal.com/Calendly 2026 comparisons.

