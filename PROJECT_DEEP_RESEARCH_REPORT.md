# Book My Records (`lotousyoga`) — Deep Research & Gap Report

**Date:** 17 Nov 2026 · **Method:** 5 parallel deep-analysis agents + manual verification of every critical claim · **Inspected:** 17 HTML pages, 16 docs, all JS/API files, assets, git history · **Tests run myself:** M2, M3, M4, E2E.

> **Verify-first note:** One agent flagged the checkup wizard as "critically broken (DOM IDs missing)". I checked directly — **false**: all IDs exist (`checkup.html:175,352,406,436,564,641,675-688`) and `checkup.js` uses null-guards. Another claimed "E2E 69/70 fail" — I re-ran all suites: **current state 70/70 PASS**. Both corrected here.

---

## 1. Executive Summary — सीधा जवाब

**Project क्या है:** BMR (Book My Records) — Indore की CA/consulting firm का marketing site, जो "Aploxn — Business Consulting" template पर बना है। ऊपर BMR ब्रांडिंग, नीचे template अभी भी जिंदा।

**सबसे बड़ी सच्चाई:** एक repo में दो अलग प्रॉडक्ट परिभाषाएँ चल रही हैं:

| | Vision A — SRS | Vision B — Foundation docs |
|---|---|---|
| क्या बनाना है | Service **booking + client portal** (login, dashboard, admin, uploads, tracking) | **Static advisory site + AI Health Checkup** |
| Status | Draft v1.0, **client-approved नहीं** (`SRS:11,21,280-289`) | "Official", M1–M5 "DONE" |
| Portal | Must (`SRS:105,109,114-116`) | **Explicitly out of scope** (`PROJECT_CONTEXT.md:62-68`) |

**स्कोरकार्ड:**

| Area | Grade | टिप्पणी |
|---|---|---|
| 6 service landing pages | **A−** | 6/6 अच्छे, minor typos |
| Checkup AI tool (code + tests) | **B+** | 90% बना; live AI key + lead capture Missing |
| Branding (लोगो, title, email, address) | **A−** | 95% clean; 3 orphan template pages |
| **Services index page** | **F** | 0% — `services1.html` 100% template demo |
| Forms / lead capture | **F** | markup है, backend नहीं |
| Content proof (team, testimonials) | **D** | service copy अच्छा, proof fabricated |
| SEO / metadata | **C−** | 10/16 descriptions, बाकि कुछ नहीं |
| Portal / Admin / Tracking (SRS) | **F** | सब कुछ नहीं बना |
| Git / deploy readiness | **F** | सब कुछ uncommitted |
| **Channels & external access** | **D** | 4 चैनल काम करते हैं; 3 का दावा है पर access नहीं; 0 notifications; 0 auth |

**एक लाइन में:** 6 landing pages + checkup tool **सही बने हैं**, लेकिन **services index बिल्कुल नहीं बनी**, **forms काम नहीं करते**, **proof content fabricated है**, और **पूरा काम commit नहीं हुआ** — deploy के लिए `main` अभी पुराना Aploxn demo है।

---

## 2. क्या सही बना है

1. **6 service landing pages** (`cfo-services.html`, `accounting-outsourcing.html`, `business-registration.html`, `taxation.html`, `ipr-registration.html`, `loan-financing.html`) — domain-specific credible copy (GSTR-1/3B, Tally Prime, MCA FiLLiP, CGTMSE, DPR, DTAA — `accounting-outsourcing.html:179-184`, `loan-financing.html:358`)। हर पेज पर hero → 6 sub-service cards (CFO पर 3) → FAQ → CTA band; हर CTA `contact.html?service=<slug>` पर (`accounting-outsourcing.html:212-292`)। Nav + footer से सभी 16 पेजों पर जुड़े (`index.html:63-68,1426-1431`)।

2. **Checkup tool** (`checkup.html`, `assets/js/checkup.js` 1236 lines, `api/checkup/{analyze,score,health}.js`) — 4-pane wizard → deterministic 25-question/6-pillar score (0–100) → report → Cal.com booking (`score.js:490-586`, `checkup.js:644-774`)। PII scrubbing (PAN/Aadhaar/GSTIN/card/account), DPDP consent, 4MB upload, in-memory processing — `analyze.js:134-197,235-289,427-428`। Gemini 2.5 Flash + synthetic fallback (`analyze.js:450-626,760-810`)। `assets/css/bmr-ds.css` हर पेज पर linked, wizard/print/responsive styles मौजूद।

3. **Branding cleanup** — 17 HTML में **0** `Aploxn`/`lotus`/`yoga`/`LMS`/`infoaploxn`; सभी `<title>` "Book My Records | ..."; email `info@bookmyrecords.com`, फोन `+91 96696 93315`, Indore address सब पर consistent।

4. **Technical hygiene** — 0 broken file links, 0 missing assets (`python scripts/audit-assets.py` खुद चलाया)।

5. **Tests (खुद चलाकर):** `verify_m2.js` → 0 errors; `verify_m3.js` → 29/29; `verify_m4.js` → 26/26; `verify_e2e.js` → **70/70 PASS**।

6. **`faq.html`** — 9 substantive BMR सवाल (`faq.html:163-275`), site का सबसे मज़बूत content पेज।

---

## 3. आपका मुख्य सवाल: Services page vs 6 landing pages

### 3.1 अभी क्या हो रहा है

**दो अलग "services" दुनियाएँ:**

| टैक्सॉनॉमी | कहाँ | कंटेंट | Discoverable? |
|---|---|---|---|
| **असली BMR (6 landing pages)** | nav dropdown, footer, home grid | पूर्ण BMR कंटेंट | ✅ हाँ |
| **Template "services index"** | `services1.html`, `service2.html`, `service-details.html` | Aploxn demo (Marketing Research, Technology, HR, Finance, International Business) | ❌ नहीं |

**`services1.html` — "All Services Portfolio" TITLE वाला पेज — 100% template demo है:**

```
services1.html:387  "CFO & Business Health Services"     → href="services1.html"  (खुद)
services1.html:415  "Marketing Research Consulting"      → href="services1.html"  (खुद)
services1.html:439  "Technology Consulting"             → href="services1.html"  (खुद)
services1.html:471  "Human Resource Consulting"         → href="services1.html"  (खुद)
services1.html:499  "Finance Consulting"                → href="services1.html"  (खुद)
services1.html:529  "International Business Consulting" → href="services1.html"  (खुद)
```
सभी 6 cards **खुद ही services1.html पर link करते हैं** — किसी का भी landing page से कोई सम्बन्ध नहीं।

**Template residue:** "Health and care consulting..." (`services1.html:391,475,533`), "CONFERNECE:" (`:560`), "Upoming Event 16th Dec", "Speaker- Saket Rathore", "If Your Need Any Consult," (`:732`)।

**`service2.html` — पूरी तरह orphan (0 inbound links):** 6 demo tabs, "Technology Assessment" **duplicate** (`:443` व `:523`), "Fintach" typo (`:490`), dead language switcher (`:181-188`), quick-search "Technology/Finance/HR..." → `cfo-services.html` भेजता है (`:162-166`) — semantically गलत।

**`service-details.html`** — generic "Business Consulting Services", healthcare FAQ "What is health and care consulting?" (`:579`), 5 identical answers, fake testimonials (Froxio/Maxcrio/Nurio, Mr. Thomas Robert, Mrs. Flurance Miyagi — `:316-374`)। सिर्फ `service2.html` से जुड़ा है।

### 3.2 Discoverability matrix

| स्रोत | 6 landing pages से जुड़ा? |
|---|---|
| Nav dropdown (सभी 16 पेज) | ✅ हाँ |
| Footer "Services" column (सभी 16 पेज) | ✅ हाँ |
| Home services grid | ⚠️ 5/6 — **CFO landing page का कोई card नहीं**; जगह 3 अलग cards सीधे `contact.html?service=...` पर (`index.html:384-461`) |
| Breadcrumb "Services" | ❌ — हर landing page पर plain text `<li>Services</li>` (`accounting-outsourcing.html:138`) |
| **"View all services" link** | ❌ — पूरे site में कहीं नहीं |
| services1 / service2 / service-details body links | ❌ — सिर्फ demo/self links |

### 3.3 नामों की गड़बड़

| Landing page | Nav/Footer नाम | Home grid नाम | H1 नाम | Status |
|---|---|---|---|---|
| cfo-services.html | CFO Services | **कोई card नहीं** (3 टुकड़े) | CFO & Business Health Services | ⚠️ सबसे खराब |
| taxation.html | Taxation & Compliance | Taxation & Compliance | Taxation & Statutory Compliance | ⚠️ 3 नाम |
| ipr-registration.html | IPR Registration | IPR Registration | IPR Registration & Brand Protection | ⚠️ minor |
| बाकी 3 | consistent | consistent | consistent | ✅ |

### 3.4 GAP — exact to-do

1. **`services1.html:387-544` के 6 cards rebuild करो** — हर card → अपना landing page:
   - CFO & Business Health Services → `cfo-services.html`
   - Business Registration & Licensing → `business-registration.html`
   - Accounting Outsourcing → `accounting-outsourcing.html`
   - Taxation & Statutory Compliance → `taxation.html`
   - IPR Registration & Brand Protection → `ipr-registration.html`
   - Loan & Finance Assistance → `loan-financing.html`
   - Template descriptions + images (`services-01.jpg...06`) BMR copy/imagery से बदलो; `:166-290` का generic "Solution Approach 01–06" हटाओ।

2. **इसे reachable बनाओ:** nav parent `href="#"` (`index.html:61`, सभी पेजों पर) → `href="services1.html"` या dropdown में "View All Services"; footer Services column में जोड़ो; 6 breadcrumbs में "Services" को link बनाओ; home `:371-375` के पास "View all services →" लगाओ।

3. **`service2.html` व `service-details.html` का फैसला करो** — दोनों orphan + misleading। delete करो या `service-details.html` को proper per-service template बनाओ। Cloudflare beacons + dead demo links (`our-people1.html`, `people-details.html`, `career.html`, `service.html`, `blog-standard.html` — `WEBSITE_AUDIT.md:95-99,167`) हटाओ।

4. **नाम unify करो** — taxation के 3 नाम; CFO एक card या तीन? अगर एक → home के 3 cards `cfo-services.html` पर ले जाओ।

**Bottom line:** 6 landing pages ठीक हैं; **ऐसा services index नहीं है जो उन्हें denote करे** — `services1.html` नाम का तो है पर अंदर से पूरा demo है और reachable भी नहीं।

---

## 4. Drawbacks / Gaps / Bad — severitywise

### CRITICAL (launch blocker)

| # | Issue | Evidence | क्यों critical |
|---|---|---|---|
| C1 | **पूरा काम uncommitted/untracked** | `git status`: 12 modified + ~20 untracked (`api/`, `docs/`, `checkup.html`, `server.js`, 5 service pages, verify scripts)। HEAD = `a7d763e` (पुराना Aploxn snapshot) | `main` से deploy किया तो पुराना demo site जाएगा। "PRODUCTION READY" दावा committed tree के लिए गलत है। |
| C2 | **Contact form काम नहीं करता** | `contact.html:157` → `<form method="POST" action="contact.html">` — self-post, कोई handler नहीं (`README.md:90` खुद कबूल) | हर CTA यहीं जाता है → **lead capture = 0**। Newsletter forms भी GET-to-self (`index.html:1364`)। |
| C3 | **Services index fully template** | ऊपर §3 | आपका मुख्य goal अभी पूरा नहीं हुआ। |
| C4 | **Published internal AI notes** | `index.html:1226` ("The supplied materials list..."), `:1250` ("No such guarantee is stated in the supplied materials."), `:1262` ("Confirm the current contact details and working hours **before launch**") | Visitors को editor instructions दिख रही हैं। |

### HIGH

| # | Issue | Evidence |
|---|---|---|
| H1 | **`.env` gitignore में नहीं** | `.gitignore` में सिर्फ `_reference/`; `analyze.js:860` `GEMINI_API_KEY` पढ़ता है → API key commit हो सकती है। |
| H2 | **32/36 `?service=` values ignore** | 46 links, 36 slugs; `contact.html:481-484` सिर्फ 4 map करता है (`checkup`, `diagnostic`, `consulting`, `cfo`) — बाकी silently चुप (`tm-filing`, `itr`, `gst-returns`, `pvt-ltd`, `dpr`, `nri-tax`...)। |
| H3 | **Health Checkup nav/footer से 14/16 पेजों पर गायब** | सिर्फ `index.html:71` व `checkup.html:69` में। सबसे बड़ा conversion page inner pages से unreachable। |
| H4 | **Fabricated proof content** | 4 team members (Arjun Kapoor = बॉलीवुड actor नाम), सबका एक ही email (`about.html:372,397,422,447`), reused testimonial photos (`about.html:514,574,529,589`), ₹3.2 Lakhs claim (`index.html:1111`), fake Clutch "50 reviews" (`index.html:1053-1068`), generic client logos `href="#"` (`index.html:351-355`)। `OPEN_QUESTIONS.md:58-73` अभी खुले हैं। |
| H5 | **No standalone Privacy Policy** | SRS FR-01 (`SRS:105`) मांगता है; सिर्फ combined `terms-conditions.html`; footer "Privacy Policy" भी उसी पर (`index.html:1445-1447`)। `<p><ul>` invalid markup `:185-191`। |
| H6 | **Live AI नहीं** | कोई `GEMINI_API_KEY`/`.env` नहीं → `analyze.js:859-864` हमेशा synthetic mode (`health.js:25-34` `ai_mode: synthetic_mock`)। |
| H7 | **Silent client fallback** | API fail → `checkup.js:736-744,534-610` client-side mock report (score 68/57.5) — user को पता नहीं चलता असली analysis है या fake। |
| H8 | **Channels/access: दावा vs access + 0 notifications + 0 auth** | WhatsApp/Google Drive/assigned-accountant दावे (`accounting-outsourcing.html:337,390`, `faq.html:252`) पर कोई link/नंबर नहीं; SRS FR-16 email notifications 0; SRS §3 RBAC 0; CORS `*` (`server.js:62`) — detail §8 |

### MEDIUM

| # | Issue | Evidence |
|---|---|---|
| M1 | SEO: कोई OG/Twitter/canonical/robots/structured data/sitemap नहीं; meta description 6 पेजों पर missing — **homepage सहित**; favicon `type="image/gif"` पर SVG (`checkup.html:28`)। |
| M2 | ~43 MB uncompressed video (`video-bg2.mp4` 24MB + `video-bg3.mp4` 19MB); `style.css` 458 KB bloat। |
| M3 | `server.js:103-107` path-traversal prefix weakness; `.mp4` MIME नहीं; `127.0.0.1` पर bind (`:142`); `vercel.json`/`.env.example` नहीं। |
| M4 | Header CTA 3 variants: "Book My Appointment" / "Book a Consultation" / "Get in Touch" (`service2.html:129`)। |
| M5 | Placeholder emails/phones: `infoexample@gmail.com` (`services1.html:750`, `service2.html:777`), `rahul@company.com` (`contact.html:180`), `you@company.com` (`checkup.html:210`), `+91 98765 43210`, `98260 11223` (`checkup.html:219`)। |
| M6 | Typos: `jsutify-content-end` (17 पेज), `CONFERNECE` (`services1.html:560`), `Fintach` (`service2.html:490`), `automated backup backups` (`accounting-outsourcing.html:377`), `contect-section6`, `tastimonial-wrap2`, `sriper`। |
| M7 | 88 social links generic platform homepages — कोई real BMR profile नहीं। |
| M8 | `main.js:1200-1206` `.sidebar-button` पर बिना null-guard listener → उस पेज पर बाकी IIFE abort; `:1284` `window.onscroll` overwrite; legacy GSAP eases (`:788,1114`)। |
| M9 | Dev artifacts web root में: `_preview-icons.html`, `.tmp-checkup-section.html` (42KB) — ship नहीं होने चाहिए। |
| M10 | Pricing पर कोई number नहीं — सब "Request a Quote" (`pricing.html:175,202,228`)। Docs में ₹4,999/₹19,999 दावा (`CONTENT_REVIEW.md:109-111`) गलत — HTML में 0 occurrences। |

### LOW
37 × `href="#"`; phone format drift (`contact.html:279`, `index.html:1262`); dropdown child active नहीं; `bmr-ds.css:16-20` duplicate tokens; `service-details.html:178-179` duplicate "Implementation Planning"।

---

## 5. Docs vs Reality — contradictions (confusion का कारण)

| विरोधाभास | Detail |
|---|---|
| Portal vs no-portal | SRS Must (`SRS:52-62`) ↔ `PROJECT_CONTEXT.md:62-68` out-of-scope। कोई reconciliation नहीं। |
| "Aploxn template" vs "Aploxn eradicated" | `README.md:3`, `.cursor/.../SKILL.md:3` अभी भी Aploxn कहते हैं; `QA_REPORT.md:19`, `CONTENT_REVIEW.md:143` कहते हैं मिट गया। HTML में 0 occurrences — **README/skill stale** हैं। |
| README ghost folders | `website-content/`, `_reference/`, `tasks/` repo में मौजूद ही नहीं (`README.md:42-45,103,114`)। |
| 24 vs 25 criteria | `TECHNICAL_FLOW.md:13` = 24, `AI_REPORT_DESIGN.md:45-55` = 25, `QA_REPORT.md:67` = 25, `USER_FLOW.md:13` = 24। |
| Quiz present vs purged | Docs में 25-question quiz (`PROJECT_CONTEXT.md:35`, `AI_TEST_CASES.md`) ↔ stakeholder directive से हटाया (`QA_REPORT.md:161-179`); HTML में 0 `q1..q25` fields। पुराने docs stale। |
| Cal.com config | `ARCH_DECISION.md:64` env `CAL_EVENT_LINK` ↔ `checkup.js:1041` hardcoded `bookmyrecords/checkup-consultation`। |
| CORS claim | docs "strict CORS policy, legitimate origins" (`AI_DATA_PRIVACY.md:152`) ↔ `server.js:62` `Access-Control-Allow-Origin: *`। |
| WhatsApp channel | SRS §8 (`SRS:202`) WhatsApp Business API excluded ↔ `accounting-outsourcing.html:337,390` और `faq.html:252` में "designated WhatsApp Business channel" दावा — पर कोई access नहीं। |
| DPO email | docs `compliance@bookmyrecords.com` (`AI_DATA_PRIVACY.md:163`) ↔ site पर सिर्फ `info@bookmyrecords.com` (`terms-conditions.html:203`)। |
| Domain drift | `bookmyrecords.co.in` (SRS) ↔ `bookmyrecords.vercel.app` (PROJECT_CONTEXT) ↔ `teamwebstarts-cmyk/bookmyrecords` (audit) ↔ local `lotousyoga`। |
| Mock vs production | `QA_REPORT.md:241-251` में `ai_mode: synthetic_mock` + `environment: production` एक साथ। |
| Open questions | SRS 14 + OPEN_QUESTIONS 8 — कभी close नहीं हुए; SRS approval table खाली (`SRS:280-289`)। |

---

## 6. कितना काम बाकी है (effort estimate)

| Priority | काम | अनुमान |
|---|---|---|
| **P0** | Services index rebuild (6 cards → 6 pages) + reachability + naming unify + service2/service-details cleanup | 1–2 दिन |
| **P0** | Contact form backend (Formspree/Formsubmit/Netlify Forms + mailto fallback), newsletter forms, 36 `?service=` mapping | 0.5–1 दिन |
| **P0** | `index.html:1226-1262` internal notes हटाना + placeholder emails/phones साफ़ + typo pass | 0.5 दिन |
| **P0** | `git add` + commit (सब कुछ), `.gitignore` में `.env`, `.tmp-*`, `_preview-icons.html` | 0.25 दिन |
| **P1** | Real team/testimonial proof या हटाना; privacy-policy.html अलग; favicon/SEO meta/OG/canonical/sitemap/robots | 1–2 दिन |
| **P1** | Gemini key + `.env.example` + real-vs-mock indicator; Cal.com account verify | 0.5 दिन |
| **P2** | Video compression / lazy load, style.css trim, server.js hardening, main.js null-guards | 1–2 दिन |
| **P2 (SRS Vision A)** | Customer portal + admin panel + document vault + tracking — **अलग project**, docs में out-of-scope भी। Client decision ज़रूरी। | 6–8 सप्ताह |

**कुल:** मौजूदा static site launch-ready करने में ~**4–7 दिन**; SRS वाला portal अलग से **6–8 सप्ताह** + client sign-off।

---

## 7. आख़िरी फैसला (verdict)

- **सही बना:** 6 landing pages, checkup tool, branding, design system, tests — फेंकने की ज़रूरत नहीं।
- **नहीं बना:** services index (आपका मुख्य goal), forms/backend, portal/admin/tracking, standalone privacy policy, SEO।
- **सबसे बड़ा draw-box (blind spot):** काम working tree में है, `main` में नहीं — और 3 \"services\" पेजों में से कोई भी असली services index नहीं है; `services1.html` सिर्फ नाम का \"All Services Portfolio\" है, अंदर से पूरा Aploxn demo, self-linked, और nav/footer से unreachable।
- **सबसे तुरंत असर दिखाने वाला fix:** `services1.html` के 6 cards को 6 landing pages से जोड़ना + nav/footer/breadcrumb से reachable बनाना + `index.html` की published internal notes हटाना + contact form को असली backend देना।
- **Decision ज़रूरी:** SRS वाला client portal बनाना है या docs वाला static advisory site — दोनों एक साथ नहीं चल सकते। Client sign-off लेकर एक चुनें और दूसरे docs को stale mark करें।

---

## 8. Channels & Access Audit (नया — coverage gap fill)

### 8.1 Contact / conversion channels — क्या वाकई काम करता है

| Channel | कहाँ | Status | Gap |
|---|---|---|---|
| फोन `tel:+919669693315` | सभी 17 पेजों के header + footer | ✅ काम करता है | एक जगह format drift (`contact.html:279` `+91 96696-93315`), एक जगह bare number (`index.html:1262`) |
| ईमेल `mailto:info@bookmyrecords.com` | header/footer + 4 team cards (`about.html:372,397,422,447`) | ⚠️ आंशिक | सिर्फ mailto — inbox/backend verify नहीं; docs का DPO email `compliance@bookmyrecords.com` (`AI_DATA_PRIVACY.md:163`) किसी HTML में published ही नहीं; grievance contact भी `info@` (`terms-conditions.html:203`) |
| Contact form | `contact.html:157` | ❌ खराब | self-POST, कोई handler नहीं → हर CTA से आया lead खत्म |
| Newsletter forms | ~16 पेज (जैसे `index.html:1364`) | ❌ खराब | GET-to-self, कोई handler नहीं |
| Checkup wizard | `checkup.html:176` | ⚠️ आंशिक | client-side scoring + report ठीक; पर कोई lead store/email/SMS नहीं |
| Cal.com booking | `checkup.html:662`, `checkup.js:1039-1049` | ⚠️ external | embed + direct link; name/email/phone/**Report ID** notes में pass (`checkup.js:1000-1005,1045-1047`) — external account live है या नहीं, repo से verify नहीं |
| Google Maps | `contact.html:265,318` | ✅ काम करता है | iframe + "View Map" link; API key ज़रूरत नहीं |
| सोशल (88 links) | header/footer सब पेज | ❌ खराब | सिर्फ `facebook.com/`, `linkedin.com/` आदि homepages — कोई real BMR profile नहीं |
| Live chat / ticketing | — | ❌ नहीं | SRS FR-24 में out of scope |
| Payment channel | — | ❌ नहीं | out of scope |

### 8.2 दावा है पर access नहीं (claimed-but-inaccessible channels)

- **WhatsApp Business drop:** "designated WhatsApp Business channel" से receipt भेजने की बात `accounting-outsourcing.html:337,390` और `faq.html:252` में है — पर **कोई नंबर, कोई click-to-chat (`wa.me`) link नहीं**। और SRS §8 (`SRS:202`) WhatsApp Business API को baseline से exclude करता है → content, docs/scope से आगे निकल गया।
- **"Encrypted Google Drive folder":** `accounting-outsourcing.html:390` — कोई Drive link/access नहीं।
- **"email them to your assigned accountant desk":** `accounting-outsourcing.html:390` — कोई assigned-accountant email/public team structure नहीं; 4 team cards का एक ही generic inbox (`about.html:372,397,422,447`)।
- **Clutch "50 reviews" badge:** `index.html:1053-1068` — `href="#"`; कोई verifiable profile नहीं।

### 8.3 Notification channels

- **SRS FR-16** ("basic email notifications" — new request, documents required, status update, completion) — **0 implementation**: `api/` में कोई SMTP / nodemailer / sendgrid / resend / webhook नहीं (सिर्फ `emailRegex` validation है — `analyze.js:342-344`)।
- **SRS §8** (`SRS:200`): email provider "client decision required" — provider, account, sender domain, template कुछ तय नहीं।
- **WhatsApp** — Phase 2 (`SRS:202`)।
- **Calendar confirmation:** docs का दावा — "BMR consulting team receives an automated calendar notification containing Report ID" (`CONSULTATION_BOOKING.md:25-27`) — ये **Cal.com का अपना notification** है; BMR सिस्टम से कोई email नहीं और Cal.com account खुद verify नहीं।
- **72-hour breach notification protocol** (`AI_DATA_PRIVACY.md:155`) — सिर्फ policy दस्तावेज़; कोई owner, alert channel या implementation नहीं।

### 8.4 External accounts / credentials / ownership

| Item | Docs में | Reality | Gap |
|---|---|---|---|
| Hosting (Vercel) | `bookmyrecords.vercel.app` (`PROJECT_CONTEXT.md:6`), dashboard + MFA (`AI_DATA_PRIVACY.md:153`) | `vercel.json`/deploy config/health URL कोई नहीं; `server.js` सिर्फ localhost `:142` | account ownership + deploy access unverifiable |
| Domain | `bookmyrecords.co.in` (`SRS:9`) **vs** `vercel.app` (docs) | कोई canonical tag नहीं | कौन-सा domain live? registrar access किसके पास? |
| Gemini key | `process.env.GEMINI_API_KEY` (`analyze.js:860`) | `.env`/`.env.example` नहीं; `.gitignore` में `.env` नहीं | key owner unknown + secret commit का खतरा |
| Cal.com | env `CAL_EVENT_LINK` (`ARCH_DECISION.md:64`) | `checkup.js:1041` में hardcoded `bookmyrecords/checkup-consultation` | account owner/validity unverified |
| Email provider | "client decision required" (`SRS:200`) | कुछ configured नहीं | SRS Q10/Q12 खुले |
| Payment gateway | out of scope | कुछ नहीं | — |
| Cloud/file storage | "secure encrypted storage" दावा (`accounting-outsourcing.html:390`, `SRS:203`) | uploads RAM-only (`analyze.js:235-289`) | कोई storage integration/account ownership नहीं |

### 8.5 Role-based access / API security

- SRS §3 में 4 roles (public/customer/admin/ops) और **server-side RBAC अनिवार्य** (`SRS:88-97`, खासकर `:97`) — static site में **0 auth**: कोई login/admin/dashboard/portal file मौजूद नहीं (glob verified)। सब कुछ public; checkup uploads ephemeral → FR-08/09 वाला "staff document review" असंभव।
- `server.js:62` — `Access-Control-Allow-Origin: *` (पूरी दुनिया से API callable) ↔ docs "strict CORS policy accepting legitimate web origins" (`AI_DATA_PRIVACY.md:152`) — **सीधा विरोधाभास**। `/api/checkup/analyze` पर कोई rate-limiting/authentication नहीं।

### 8.6 Coverage checklist (ये सब check किया गया)

```
HTML pages       : 17  (nav, footer, title/meta, h1, forms, media, links, CTAs)  ✔
Docs             : 16  (SRS + docs/bookmyrecords/* + README + TEST_READY)          ✔
Services         : 6 landing pages + services1/2/service-details + home grid      ✔
Checkup          : checkup.html + checkup.js + api/{analyze,score,health} + server ✔
Assets/CSS       : bmr-ds.css, style.css, all img/video, audit-assets.py           ✔
Scripts/tests    : verify_m2/m3/m4/e2e (सभी चलाए गए), prepare-service2.py         ✔
Git/runtime      : status, log, branch, .gitignore, node_modules/package.json       ✔
Channels/access  : phone/email/form/newsletter/checkup/Cal.com/map/social/whatsapp/Drive,
                   notifications, external accounts, credentials, RBAC, CORS        ✔  (ये section 8)
```

### 8.7 इनसे नए निकले काम (effort में जोड़ें)

| Priority | काम | अनुमान |
|---|---|---|
| **P0** | WhatsApp/Google Drive/"assigned accountant" वाले दावे हटाएँ या **असली linking नंबर/लिंक** दें; Cal.com account verify; CORS `*` को restrict; `.env.example` + `.gitignore` में `.env`; DPO email (`compliance@`) vs `info@` unify | 0.5–1 दिन |
| **P1** | Email notification backend (SRS FR-16) — provider चुनकर new-request/status/completion emails; 72-hour breach protocol का owner + channel तय | 1–2 दिन |
| **P1 (decision)** | SRS Q10 (hosting/domain/email/payment account + ownership) और Q12 (legal/consent content) पर client sign-off — बिना इसके deploy/notification संभव नहीं | client-dependent |

---

## Appendix — verification evidence

```
verify_m2.js   → ALL CHECKS PASSED: 0 errors
verify_m3.js   → TOTAL 29 / PASSED 29 / FAILED 0
verify_m4.js   → TOTAL 26 / PASSED 26 / FAILED 0
verify_e2e.js  → TOTAL 70 / PASSED 70 / FAILED 0
audit-assets.py → 0 missing refs on every page
git status      → 12 M + ~20 ?? (api/, docs/, checkup.html, server.js, 5 pages, tests)
git log -1      → a7d763e Merge PR #6 (पुराना committed state)
```


