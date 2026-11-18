# Template / Demo Residue — Complete Removal Documentation

**Project:** `lotousyoga` (Book My Records) · **Date:** 17 Nov 2026 · **Mode:** research-only, no code changed
**Scope:** 232 files scanned (text + filenames), 4 parallel deep agents + manual verification; `.git/` internals excluded, binaries inspected by filename.
**Goal:** repo में **कोई भी** legacy template/demo keyword या URL connection न बचे — HTML, CSS, JS, docs, scripts, .cursor/, tests, assets, filenames, git history सब मिलाकर।

> **Verify-first correction:** एक agent ने बताया `.tmp-checkup-section.html` मौजूद है —मैंने जाँच में **नहीं पाया**; असली artifacts हैं `.tmp-report-pane.html`, `.tmpsplice.js`, `tmpcheck2.js`। नीचे सही नाम ही दिए गए हैं।

---

## 1. Executive summary — सीधा जवाब

| प्रश्न | उत्तर |
|---|---|
| `Foxknow` / `Fox Know` शब्द कहीं है? | **0 occurrences** — working tree **और** सभी 43 commits में नहीं |
| standalone `APL` / `APL option` शब्द? | **0 occurrences** — सिर्फ `APLOXN`, `aploxn`, `AAAPL1234C` (PAN-like टेस्ट ID) मिले |
| असली Residue क्या है? | `Aploxn` / `Egens Lab` / `infoaploxn@gmail.com` + demo data/नाम/placeholder |
| कितनी जगह? | **Group A:** 67 occurrences / 11 files · **Group B:** 140 occurrences / 18 files |
| जीवंत demo URL connection? | **1** — `scripts/prepare-service2.py:7` → `https://demo.egenslab.com/html/aploxn/preview/` |
| HTML में brand residue? | **0** (working tree) — पर **HEAD (committed) में 11 HTML files में मौजूद** |
| Git history? | 43/43 commits में residue; 15 committed files प्रभावित |
| सबसे बड़ा अवरोधक? | `.cursor/.../bmr-brand-system.md:3` — "**Do not delete template docs**" |
| सबसे बड़ा जाल (trap)? | `verify_m2.js:15-19` / `verify_e2e.js:285,298` में खुद brand शब्द 'needle' के रूप में हैं — हटाएँ तो tests अंधे हो जाएँगे |

**निष्कर्ष:** HTML साफ़ है, पर **docs, .cursor, scripts, CSS header, test files, committed tree और history अभी गंदे हैं**। नीचे पूरा removal runbook है।

---

## 2. Method & coverage

```
scanned : 17 HTML · 4 verify_*.js · api/* · server.js · assets/css/*.css · assets/js/*.js
          · scripts/*.py · docs/bookmyrecords/*.md (16) · .cursor/**/*.md (11)
          · README.md · SRS · TEST_READY.md · PROJECT_DEEP_RESEARCH_REPORT.md
          · .gitignore · .cursor hidden files · 232 total files
patterns: aplox|aploxn|egens|fox\s?know|\bAPL\b|demo|template|placeholder|lorem|
          infoaploxn|hello@|desky|Froxio|Maxcrio|Nurio|Thomas Robert|Flurance Miyagi|
          Rakhab Uddin|CONFERNECE|Fintach|Apex|98765 43210|98260 11223|$170|$270
URLs    : https?:// · //host · href · src · action · url() · @import · fetch() · iframe · mailto: · tel: · href="#"
git     : git grep -i <term> HEAD · git log --all -S <term> · git status/ls-files/branches
```

---

## 3. Group A — brand/keyword residue (67 occurrences / 11 files) — MUST REMOVE

| File | Lines (count) | क्या है |
|---|---|---|
| `docs/bookmyrecords/WEBSITE_AUDIT.md` | 14(×2), 20, 63-71, 115(×2), 117, 213, 215 (**17**) | present-tense "built upon Aploxn by Egens Lab", `<title>` rows, remediation instructions |
| `PROJECT_DEEP_RESEARCH_REPORT.md` | 11, 36, 46(×2), 65, 132, 175(×3), 210 (**10**) | मेरी अपनी रिपोर्ट में भी keyword — खुद को भी साफ़ करना होगा |
| `docs/bookmyrecords/CONTENT_REVIEW.md` | 13, 18, 29, 30, 141, 143, 176(×2) (**8**) | "0 occurrences / eradicated" वाले historical दावे |
| `verify_e2e.js` | 284, 285(×3), 294, 298(×2) (**7**) | test titles + forbidden needles |
| `assets/css/style.css` | 2, 3(×2), 4, 5 (**5**) | header: Project Name / Author / support URL / developer email |
| `verify_m2.js` | 15, 17, 18, 19 (**4**) | forbidden needles |
| `.cursor/skills/website-design-system/SKILL.md` | 3, 6, 8(×2) (**4**) | "# Aploxn Design System" + Egens Lab |
| `docs/bookmyrecords/QA_REPORT.md` | 19, 66, 141, 143 (**4**) | "legacy Aploxn placeholders" दावे |
| `.cursor/.../references/bmr-brand-system.md` | 3(×2), 81 (**3**) | "Do not delete template docs" + `Template (Aploxn)` column |
| `scripts/prepare-service2.py` | 7(×2), 10 (**3**) | demo URL + clone path |
| `README.md` | 3, 74 (**2**) | "Aploxn template site" + `infoaploxn@gmail.com` |

**Exact-string subtotals:** `Aploxn` = 36 · `APLOXN` = 1 · `Aploxn- Business Consulting HTML Template` = 10 · `infoaploxn@gmail.com` = 15 · `Egens Lab` = 4 · `egenslab` URLs = 6.

**Pass — बिल्कुल साफ़:** सभी 17 `*.html`, `.gitignore`, `server.js`, `api/checkup/*.js`, `verify_m4.js`, `verify_m3.js`, `.tmpsplice.js`, `.tmp-report-pane.html`, `tmpcheck2.js`।

---

## 4. Group B — demo data / fake people / placeholder content (140 occurrences / 18 files) — MUST REMOVE

### 4.1 HTML bodies

| File | Lines | Residue |
|---|---|---|
| `checkup.html` | 188, 196, 203, 210, 219 | "Fill demo data", `Apex Engineering Pvt Ltd`, `Vikram Shinde`, `you@company.com`, `98260 11223` |
| `contact.html` | 162, 168, 174, 180, 226 | `Rahul`, `Sharma`, `+91 98765 43210`, `rahul@company.com`, generic message |
| `services1.html` | 391, 475, 533, 560, 568, 573, 591, 610/639/668/697, 732, 744-768 | "Health and care consulting…", `CONFERNECE:`, `Upoming Event 16th Dec`, `Speaker- Saket Rathore`, "Excellent Service Provided by Our Superb Consultant.", fake team, `infoexample@gmail.com`, `Consult Pro`, `Dealership` |
| `service2.html` | 155, 181-188, 490, 547, 670, 759, 771-795 | `Enter your keywords`, dead 6-language switcher, `Fintach`, template testimonial, `Saket Rathore`, `infoexample@gmail.com` |
| `service-details.html` | 316-374, 422, 570, 579, 591 | **Froxio / Maxcrio / Nurio**, `Mr. Thomas Robert`, `Mrs. Flurance Miyagi`, `Mr. Rakhab Uddin`, "What is health and care consulting?", 5 identical FAQ answers |
| `about.html` / `index.html` | 190/382-447/514-592 · 949-1027/1107-1185 | BMR persona names (decision needed), 6 fabricated local testimonials on reused template avatars |

### 4.2 JS / test demo data

| File | Lines | Residue |
|---|---|---|
| `assets/js/checkup.js` | 526-545, 558, 564 | `fillSampleData()` → `Apex Precision Engineering Pvt Ltd`, `Vikramaditya Shinde`, `vikram@apexengineering.in`, `9826011223`, `Apex_FY25_Financial_Summary.pdf`, `BMR-MOCK-######` |
| `verify_e2e.js` | 382, 442-665, 674, 720, 933-1002 | `Apex Engineering Works`, `ApexSaaS Technologies LLP`, `arjun@apexsaas.io`, `98260…`, `AAAPL1234C` filenames, clinical/medical scenario text |
| `verify_m3.js` | 246, 348-349 + | synthetic PII strings, `vikram@kalyanengineering.com`, test@example.com |
| `verify_m2.js` | 16, 20-25 | `+91 656 786 53`, `example123@gmail.com`, `$170`, `$270`, `Tally Prime course`, `job assurance program`, `Tally Course Alumni` (needles) |
| `docs/bookmyrecords/AI_TEST_CASES.md` | 28 | `9826011223` |

> **Note:** `$170`/`$270`, foreign fake consultants (`Mr. Daniel Scoot`, `Mrs. Emily Sophia`, …), `Riya Verma` aur "selling a home" FAQ **ab HTML में नहीं हैं** — सिर्फ docs में इतिहास के रूप में। Docs को साफ़ करते समय इसे ध्यान में रखें।

### 4.3 Group C — FALSE POSITIVES (न हटाएँ)

| Pattern | Count | कारण |
|---|---|---|
| `fox` | 11 | सिर्फ **Firefox** — `SRS:171`, `bootstrap-icons.css:1745`, `boxicons.min.css:1`, `boxicons.svg:69`, `aos.js:1`, `bootstrap.min.js:6`, `isotope.pkgd.min.js:11`, `popper.min.js:5`, `TweenMax.min.js:15` |
| `know` | 18 | सामान्य अंग्रेज़ी ("We know…") — `index.html:134`, `faq.html:154`, `api/checkup/score.js:222,266,309`, etc. |
| `APL` (standalone) | 0 | `AAAPL1234C` PAN-like test IDs (`verify_e2e.js:674,720`, `QA_REPORT.md:78`) — KEEP |
| `grid-template-columns`, `placeholder=""` attribute | ~350+ | CSS/HTML तकनीकी शब्द — KEEP |
| `lore` | ~116 | substrings of `explore`, `color`, `tailored` — KEEP |
| `home6-*`, "Home 06" | ~144 | CSS class नाम — brand residue नहीं |
| `Tally Prime` (domain content) | — | legitimate — `faq.html:8,247`, `accounting-outsourcing.html:8,133`, `api/checkup/score.js:369` — KEEP; सिर्फ "Tally Prime course"/"Tally Course Alumni" demo residue है |
| `cloudflare` | — | सिर्फ docs में हटाए गए beacons का इतिहास + `index.html:1492` comment — comment हटाएँ, vendor license छोड़ें |
| `greensock.com`, `github.com`, `swiperjs.com`, `getbootstrap.com` | — | vendor license comments — KEEP |

---

## 5. URL / connection inventory — क्या जुड़ा है, क्या काटना है

### 5.1 External hosts (176 substantive URLs, 47 hosts)

**KEEP — functional/vendor:**
`fonts.googleapis.com` (`style.css:81`) · `maps.google.com` (`contact.html:265,318`) · `cal.com` + `app.cal.com` (`checkup.html:662`, `checkup.js:1033,1041`) · `generativelanguage.googleapis.com` (`analyze.js:761`) · local vendor JS/CSS (jQuery, Bootstrap, Swiper, GSAP, Slick, Chart.js, Fancybox, Isotope, AOS, SimpleParallax) · vendor license URLs in comments · `www.w3.org` XML namespaces (274×, not connections).

**REMOVE — demo / fake / dead connection:**

| # | file:line | connection | action |
|---|---|---|---|
| 1 | `scripts/prepare-service2.py:7` | `https://demo.egenslab.com/html/aploxn/preview/` | **delete script** (या BASE + urllib block हटाएँ) |
| 2 | `scripts/prepare-service2.py:8-14` | `aploxn-service2-clone`, `_reference` paths | delete with script |
| 3 | `scripts/prepare-service2.py:17-73` | Cloudflare `data-cfemail`, `/cdn-cgi/...`, `decode_cfemail()` | delete with script |
| 4 | `assets/css/style.css:3` | `https://www.egenslab.com/` | header rewrite |
| 5 | `assets/css/style.css:4` | `https://egenslab.desky.support/` | header rewrite |
| 6 | `assets/css/style.css:5` | `hello@egenslab.com` | header rewrite |
| 7 | all HTML footer/team cards (88 links) | `twitter.com/`, `linkedin.com/`, `facebook.com/`, `instagram.com/` — generic homepages | real BMR profiles या icons हटाएँ |
| 8 | `index.html:1077-1094`, `about.html:484-501` | Clutch `href="#"` + fake "(50 reviews)" badge | हटाएँ / verifiable profile |
| 9 | `index.html:374-378`, `about.html:161-165` | 10 client logos `href="#"` + empty `alt` | real proof या हटाएँ |
| 10 | `service2.html:182-187` | 6-language switcher `href="#"` | पूरा `.lang-card` block हटाएँ |
| 11 | `services1.html:568,573,578` | 3 demo-event `href="#"` | event block हटाएँ |
| 12 | 16 HTML files | Services dropdown parent `href="#"` → real services index (`services1.html`) | main report §3.4 |
| 13 | `index.html:1492` | `<!-- Cloudflare email-decode script not needed locally... -->` | comment हटाएँ |

### 5.2 Dead demo routes — HTML में 0, सिर्फ docs/CSS keywords में

`our-people1.html` (`WEBSITE_AUDIT.md:67,95`) · `people-details.html` (`:96` + CSS classes `style.css:14744,14776,17925-17983`) · `career.html` (`:67,97`) · `service.html` (`:98`) · `blog-standard.html` (`:99`) · `blog-grid.html` (`CONTENT_REVIEW.md:17,147`; `WEBSITE_AUDIT.md:89,211`; `README.md:108`; `.cursor/.../implementation-guidelines.md:72`) · `index2.html` (`README.md:108`) · `portfolio-single` (`style.css:10094`; `.cursor/.../assets-and-icons.md:33`).

### 5.3 `href="#"` count — 38 in HTML

16 services-dropdown stubs · 10 client logos · 2 Clutch badges · 6 dead language items · 3 demo events · 1 legit `#our-services` anchor (`index.html:154`) · review sliders (same 2 anchors). Removal mapping ऊपर §5.1 में।

### 5.4 CSS url() connections

`@import fonts.googleapis.com` (`style.css:81`) KEEP · slick fonts `assets/css/fonts/slick.*` local (Slick slider रखें तो KEEP) · `ajax-loader.gif` template spinner (Slick के साथ) · `data:` URIs self-contained KEEP · ~30 local `url(../img/homeN/...)` — file rename/delete करते समय corresponding CSS rule भी हटाएँ।

---

## 6. Assets / filenames / visual residue

### 6.1 CSS/JS header comments

- **`assets/css/style.css:1-77`** — पूरा template attribution block: `Project Name: Aploxn- Business Consulting HTML Template`, `Author: Egens Lab`, support/dev URLs, developer email + 68-entry TOC — जिसके माध्यम से छह demo homepages (`04. Home1 Banner` … `54. Home6 Contact Section`) और demo pages (`61. Career Page`, `64. Apply Position`, `66. People Details`, `67. Case Study`, `68. Industry Details`) नाम दिए गए हैं। → BMR header से बदलें, **पर पहले starter-theme license/attribution requirement check करें**।
- `assets/css/bmr-ds.css:3,223` — सिर्फ वर्णनात्मक "template CSS variables", "Template light-blue bands" → "legacy stylesheet" कहें (वैकल्पिक)।
- **`KEEP` third-party license/@author comments:** `gsap.min.js:7`, `ScrollTrigger.min.js:7`, `TweenMax.min.js:12` (Jack Doyle), `jquery.marquee.min.js:3` (Aamir Afridi), Swiper/SimpleParallax/Waypoints headers — ये vendor attribution हैं, हटाना गलत होगा।

### 6.2 Orphan files — बिना कोड बदले delete कर सकते हैं (~28 MB)

```
assets/img/hero bg.png                    (1.52 MB, filename में space)
assets/img/black-logo.svg  white-logo.svg  footer-logo.svg        (template wordmark glyphs)
assets/img/home1/clutch-logo-white.svg
assets/img/home2/about-img.jpg  blog-img-01..04.jpg  client-logo1..6.png
assets/img/home4/australia.png  Graph.png
assets/img/home5/find-job.jpg
assets/img/home6/author.png  author2.jpg  author3.jpg  circle.svg
assets/img/home6/hero-bg-revamp.jpg  hero-bg-sm.png  hero-illustration.png  hero-design-reference.png
assets/img/inner-pages/faq-img.jpg
assets/video/video-bg2.mp4                (24.16 MB — किसी page में use ही नहीं)
_preview-icons.html
.tmp-report-pane.html   .tmpsplice.js   tmpcheck2.js   (dev scratch artifacts)
scripts/prepare-service2.py               (demo downloader)
assets/img/why-choose-us/icon-*.svg       (4 files — सिर्फ _preview-icons.html में)
```

### 6.3 CSS-DEAD — file + संबंधित CSS rule साथ हटाएँ

```
assets/img/home1/contact-bg.jpg             style.css:7051
assets/img/home1/industrial-bg.jpg          style.css:6989
assets/img/home3/banner-img-01.png          style.css:9654
assets/img/home3/testimonial-shape.png      style.css:8257
assets/img/home3/zoom.svg                   style.css:10372
assets/img/home4/country-bg.png             style.css:11106
assets/img/home4/testimoial-bg.png          style.css:8127
assets/img/home5/banner-bg.jpg              style.css:11964
assets/img/home5/play-btn.svg               style.css:12243
assets/img/home5/video-close.svg            style.css:12374,12377,12380
assets/img/home6/pata.png                   style.css:5446
assets/img/inner-pages/Vector/portfolio-single-content-bg.svg   style.css:10094
```

### 6.4 USED files — rename/replace (delete नहीं, replacements दें)

| File(s) | कहाँ | action |
|---|---|---|
| `home1/company-logo-01..05.png` | `index.html:374-378`, `about.html:161-165` | real BMR clients + alt text; `href="#"` हटाएँ |
| `home1/testi-oth-01..04.png` | `index.html:1107-1182`, `about.html:514-589` | fabricated testimonial avatars → authentic photos/initials |
| `home1/clutch-logo.svg` + "(50 reviews)" stars | `index.html:1077-1094`, `about.html:484-501` | fake badge हटाएँ |
| `home6/people-01..04.png` | `index.html:949-1024`, `about.html:357-432` | fake team portraits → real team |
| `home6/services-01..04.jpg` | `index.html:405-575` | generic service art → BMR-specific |
| `home2/*`, `home4/*` (people/services/testimonial images) | सिर्फ `services1.html`, `service2.html`, `service-details.html` | **पहले इन 3 pages का fate तय करें** — delete/rebuild करने पर ये सब orphan हो जाएँगे |
| `assets/video/video-bg3.mp4` (18.81 MB) | `index.html:346,349` | BMR walkthrough/poster से बदलें |
| `assets/img/sm-logo.svg` | favicon, 16 pages | generic double-chevron mark — official BMR favicon हो तो बदलें |
| `inner-pages/braadcrumb-bg*.jpg` | सभी inner pages | spelling typo (cosmetic rename, brand residue नहीं) |

---

## 7. Git / history — सबसे बड़ा hidden gap

- `HEAD = a7d763e`, **43 commits**, branches: `main` + `origin/{HEAD,main,dev,feature/bmr-design-system,theme-experimenting}`।
- `git grep -i -e aploxn -e egens HEAD` → **15 committed files** में hits; उनमें से **11 HTML working-tree में साफ़ हैं** (क्योंकि वे 12 modified files में हैं)। मतलब cleanup **सिर्फ HTML तक सीमित** है।
- Committed residue files: `README.md`, `.cursor/.../SKILL.md`, `.cursor/.../bmr-brand-system.md`, `scripts/prepare-service2.py`, `assets/css/style.css:2-5`, `about.html`, `accounting-outsourcing.html`, `contact.html`, `faq.html`, `index.html`, `pricing.html`, `service-details.html`, `service2.html`, `services1.html`, `terms-conditions.html`।
- Root commit `3f2ce3b` में खुद **live source URL** `https://demo.egenslab.com/html/aploxn/preview/index6.html` (`README.md:13`) + CSS header + brand title — सभी 43 commits में residue।
- `git log --all -S aploxn` → 11 commits; `-S egenslab` → 7 commits; `Foxknow` → 0; standalone `APL` → 0.

**History policy — तीन विकल्प:**

| विकल्प | परिणाम | जोखिम |
|---|---|---|
| **A. Accept history** (recommended if policy = current tree) | नया clean commit; पुराने 43 commits में residue रहेगा | "कहीं भी 0 occurrences" सच नहीं — clones/history में मिलेगा; docs में exception दर्ज करें |
| **B. Rewrite history** (`git filter-repo --replace-text`) | सच में सब commits में 0 | **Destructive**: force-push `--all --tags`, branches/PRs/forks/clones टूटेंगे, reflog expire, सब contributors को re-clone; `a7d763e` जैसे SHA references stale |
| **C. Orphan/squash `main`** | single clean commit | history discard; same force-push coordination |

> मैंने **कोई history rewrite नहीं किया** — यह user decision है। आप review करके चुनें।

---

## 8. Test-suite trap — सबसे खतरनाक जाल

`verify_m2.js:14-26` और `verify_e2e.js:284-300` में brand शब्द **खुद detection needles** के रूप में हैं। उन्हें सीधे हटाने पर:

- `verify_m2.js` CHECK 1 — legacy mailbox/phone/title/brand detection खत्म;
- `verify_e2e.js` **T1.3.1** — `forbiddenBranding` खाली होने पर loop नहीं चलेगा और test **हमेशा pass** होगा (vacuous guard) — सबसे खतरनाक;
- `verify_e2e.js` T1.3.2 — सिर्फ mailbox assertion खत्म।

**सुरक्षित refactoring (guard बचाकर, plaintext keyword हटाकर):**

```js
const LEGACY_BRAND  = String.fromCharCode(97,112,108,111,120,110);          // aploxn
const LEGACY_MAIL   = Buffer.from('aW5mb2FwbG94bkBnbWFpbC5jb20=', 'base64').toString('utf8');
const LEGACY_TITLE  = `${LEGACY_BRAND[0].toUpperCase()}${LEGACY_BRAND.slice(1)}- Business Consulting HTML Template`;
const forbidden = [LEGACY_MAIL, '+91 656 786 53', LEGACY_TITLE, LEGACY_BRAND,
                   LEGACY_BRAND.toUpperCase(), 'example123@gmail.com', '$170', '$270', ...];
```

`verify_e2e.js` में भी यही constants.use करें; test titles बदलें: "Zero occurrences of **legacy branding** or starter-template titles…" / "…**legacy placeholder mailboxes**…"। बेहतर: constants एक shared helper module में रखें ताकि दोनों suites drift न हों। **साथ ही scan scope बढ़ाएँ** — अभी सिर्फ root `*.html` scan होता है; repo-wide policy के लिए docs/, .cursor/, scripts/, CSS header भी जोड़ें।

---

## 9. Active removal blocker

`.cursor/skills/website-design-system/references/bmr-brand-system.md:3` में लिखा है: **"Do not delete template docs; override via scoped CSS when rolling out BMR."** plus `SKILL.md:16,34,72` ("Old CSS is frozen", "do not rewrite template style.css blocks until approved") — ये निर्देश agent को removal से रोकते हैं। Rewrite करें:

- `:3` → "Legacy token values in `design-tokens.md` are kept only as historical reference. **Do not delete design-system docs**; retire legacy values via scoped overrides as they are removed."
- `SKILL.md` → नाम "# Book My Records Design System"; frontmatter `name: website-design-system` और path **वैसा ही रखें** ताकि `README.md:104` का pointer काम करे।

---

## 10. Complete action plan — file-by-file removal runbook

### Phase A — delete/quarantine पहले
1. `scripts/prepare-service2.py` **delete** (demo host + clone path + Cloudflare decoder एक साथ चले जाते हैं)।
2. Dev artifacts **delete**: `_preview-icons.html`, `.tmp-report-pane.html`, `.tmpsplice.js`, `tmpcheck2.js`।
3. `.gitignore` expand करें: `.env`, `.tmp-*`, `tmp*.js`, `_preview-icons.html`, `node_modules/`, `.DS_Store` (अभी सिर्फ `_reference/` है)।

### Phase B — committed source/config rewrite, फिर commit
4. `assets/css/style.css:1-77` → BMR header से बदलें (license/attribution check के बाद); `:81` Google Fonts `@import` रखें।
5. `README.md:3,42,74,108,110` → BMR-only वाक्यांश; `README.md:104` (design-system pointer) बनाए रखें।
6. `.cursor/skills/website-design-system/SKILL.md:3,6,8,16,34,72` → BMR Design System; vendor name हटाएँ; "frozen CSS" rule हटाएँ।
7. `.cursor/.../references/bmr-brand-system.md:3,26,41,43,57,62,81` → neutral wording; "Do not delete template docs" हटाएँ; table column `Legacy token (to be retired)`।
8. `.cursor/.../references/design-tokens.md:5`, `implementation-guidelines.md:62,72,79` → "legacy stylesheet" / current 17-page scope। बाकी `references/*.md` में generic "template" शब्द वैकल्पिक cleanup।
9. `index.html:1492` — Cloudflare comment हटाएँ।

### Phase C — untracked docs rewrite (zero-keyword policy के लिए अनिवार्य)
10. `PROJECT_DEEP_RESEARCH_REPORT.md:11,28,36,46,65,67,132,175,210` → "legacy starter template/demo" शब्दावली; SHA references history decision के बाद update। (मेरी पिछली report में भी ये keywords हैं — zero-keyword policy में उसे भी साफ़ करना होगा।)
11. `docs/bookmyrecords/WEBSITE_AUDIT.md:14,18-20,63-71,115,117,212-215` → "legacy starter template", "legacy placeholder mailbox" — सभी findings सुरक्षित रखें।
12. `docs/bookmyrecords/CONTENT_REVIEW.md:13,18,29,30,141,143,176` → वही treatment।
13. `docs/bookmyrecords/QA_REPORT.md:19,66,141,143,+demo शब्द वाली जगहें` → "legacy template placeholders"; `OPEN_QUESTIONS.md:37,59` → "legacy placeholder prices/stock photos" (वैकल्पिक)।
14. `SOFTWARE_REQUIREMENTS_SPECIFICATION.md`, `TEST_READY.md`, बाकी 12 docs — **no edit**, सिर्फ re-verify।

### Phase D — tests (guards बचाएँ)
15. `verify_m2.js`, `verify_e2e.js` → §8 का derived-token refactor; scan scope repo-wide; test titles rename।
16. HTML demo-data/placeholders साफ़ करें: `checkup.html:188,196,203,210,219` · `checkup.js:526-545,558` · `contact.html:162-180` · `services1.html:744-768` · `service2.html:771-795` (या तीनों template pages delete/rebuild — main report §3.4)।
17. Fake proof blocks हटाएँ: `index.html:374-378,1077-1094` · `about.html:161-165,484-501` · `service-details.html:316-374` · `service2.html:181-188` · `services1.html:560-578`।

### Phase E — assets, commit, history
18. §6.2 orphan files delete; §6.3 CSS-DEAD files **rules के साथ** delete; §6.4 used files replace (3 template pages का fate पहले तय करें)।
19. All changes commit करें — **user की अनुमति के बिना commit नहीं** (अभी मैंने कुछ भी edit/commit नहीं किया)।
20. History policy A/B/C चुनें (§7) और docs में दर्ज करें।

---

## 11. Verification commands (removal के बाद चलाएँ)

```powershell
# 1) Repo-wide zero-keyword check (.git excluded)
$terms = 'aploxn|fox\s?know|\bAPL\b|egens|infoaploxn|demo\.egenslab\.com|hello@egenslab|desky\.support'
Get-ChildItem -Recurse -File | Where-Object { $_.FullName -notmatch '\\\.git\\' } |
  Select-String -Pattern $terms -CaseSensitive:$false
# expected: 0 lines (history policy B/C चुने तो git grep भी 0)

# 2) Committed tree check
git grep -i -e aploxn -e egens HEAD        # policy A: 15 files expected; policy B/C: 0
git log --all -S aploxn --oneline          # policy B/C: empty

# 3) Dead links / href="#" check
Select-String -Pattern 'our-people1\.html|people-details\.html|career\.html|service\.html|blog-standard\.html|blog-grid\.html|index2\.html' *.html
Select-String -Pattern 'href="#"' *.html   # expected: 0 (or only documented in-page anchors)

# 4) Tests — counts must NOT DROP (a drop = guard went blind)
node verify_m2.js          # expect 0 errors
node verify_m3.js          # expect 29/29
node verify_m4.js          # expect 26/26
node verify_e2e.js         # expect 70/70
python scripts/audit-assets.py   # expect 0 missing

# 5) Decode-check derived tokens resolve correctly
node -e "console.log(String.fromCharCode(97,112,108,111,120,110)); console.log(Buffer.from('aW5mb2FwbG94bkBnbWFpbC5jb20=','base64').toString('utf8'))"

# 6) Dev artifacts gone
Test-Path scripts/prepare-service2.py   # False
Test-Path _preview-icons.html           # False
```

---

## 12. Final checklist

- [ ] `Foxknow`/`Fox Know`/standalone `APL` — confirm 0 (they never existed; tracked here for audit trail)।
- [ ] Group A 67 occurrences → 0; Group B 140 occurrences → 0 (or intentionally replaced)।
- [ ] `scripts/prepare-service2.py` absent; demo.egenslab.com URL 0 hits.
- [ ] `assets/css/style.css:1-77` header neutralized; license check done.
- [ ] `.cursor` skill renamed to BMR; "Do not delete template docs" gone; frontmatter/path intact.
- [ ] `README.md`, 3 audit docs, QA/CONTENT_REVIEW, previous reports — all neutral wording.
- [ ] `verify_m2.js`/`verify_e2e.js` guards intact via derived tokens; counts 0/29/26/70 unchanged.
- [ ] 88 social placeholder links, Clutch badge, client logos, language switcher, demo events — removed or real.
- [ ] Orphan assets (~28 MB) + CSS-DEAD files+rules removed; used assets replaced.
- [ ] `.gitignore` expanded; dev artifacts absent.
- [ ] History policy (A/B/C) decided and recorded; clean-clone test done.
- [ ] **No commit made yet** — user review first.

---

## Appendix — audit trail

```
agents        : 4 parallel (keyword / URL / docs-git / assets) + manual verification
files scanned : 232
Group A       : 67 hits / 11 files   (brand keywords)
Group B       : 140 hits / 18 files  (demo data, fake people, placeholders)
Group C       : ~350+ benign hits    (Firefox, grid-template, explore, vendor licenses)
live demo URL : 1 (prepare-service2.py:7)
committed     : 15 files with residue at HEAD; 43/43 commits carry it
Foxknow / APL : 0 in tree and history
```



