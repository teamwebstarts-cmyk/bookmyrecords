# BookMyRecords — Report Document Design Specification

**Scope**: Step 3 report pane only — `#analysis-report` in `checkup.html`, its `report-*` / `*-container` ids, `renderReport()` + `initCalBooking()` in `assets/js/checkup.js`, appended rules in `assets/css/bmr-ds.css`.
**Status**: implementation-ready, append-only. Supersedes v1.0 of this file (that AI/scoring/JSON material now lives in `AI_DATA_PRIVACY.md`, `TECHNICAL_FLOW.md`, and §11 here).

| Constraint | Rule |
|---|---|
| Files this spec may touch | `checkup.html` (report pane), `assets/js/checkup.js` (`renderReport`, `initCalBooking`), `assets/css/bmr-ds.css` (append at end only) |
| Ids that MUST survive | `report-company-name`, `report-id-display`, `report-date-display`, `report-industry-display`, `report-turnover-display`, `report-score-number`, `report-score-circle`, `report-risk-band-pill`, `report-risk-band-desc`, `executive-summary-text`, `pillar-cards-container`, `key-strengths-container`, `critical-gaps-container`, `observations-container`, `risks-container`, `opportunities-container`, `plan-30/60/90-container`, `agenda-container`, `btn-print-report`, `btn-retake-checkup`, `btn-go-to-booking`, `cal-inline-embed`, `booking-block`, `analysis-report` |
| Fonts | Marcellus (serif, weight 400 only) and Montserrat. Nothing else. |
| Existing print block | `bmr-ds.css` `@media print` at line ~1168 stays byte-identical. |
| Naming | Every new class starts `bmr-report`; no new global selectors; no `!important` outside print. |

---

## 1. Design intent and the failure modes being fixed

The report must read as **a document the firm would put its name on and email as a PDF** — a diagnostic memo or credit-appraisal note, not a dashboard. One idea per section, one accent per meaning, the reader's eye never asked to admire the design. **Rule 0**: if a decision cannot be justified by "this is how the number is read correctly", delete it.

| # | Failure mode | Evidence in code | Fix |
|---|---|---|---|
| F1 | Too many accents in one view | `text-success`, `text-danger`, `text-warning`, `bg-primary-subtle`, `.phase-30/60/90` (red/amber/sky), 4 badge hues per pillar | §3: two data hues + neutral |
| F2 | Gradient/glow decoration | `.report-header-banner { background: linear-gradient(135deg,#0b5ed7,#1f2a44) }`; bullet `box-shadow: 0 0 0 4px rgba(11,94,215,.15)` | §4: flat ink, hairline rules |
| F3 | Badge + icon density | every heading has a `bi-*` icon; every row a pill | §2/§9: no icons, no pills; status is words |
| F4 | Score as hero gauge | `.score-circle-display` 140px ring, 2.8rem figure | §5: bordered score block + band scale |
| F5 | No document header | marketing banner; no prepared-by, classification, or basis line | §4.2 |
| F6 | No numbering or contents | sections are visually equal cards | §4.3–4.4 |
| F7 | Inconsistent measure | Bootstrap 6/4 cols; prose runs full card width | §2.4 |
| F8 | Card soup | 11 sibling cards, each own border + shadow | §4: one sheet, rules between sections |

---

## 2. Typography (report scope only)

Root `.bmr-report { font-size: 16px; }` — never inherit body size.

### 2.1 Scale (screen)

| Token | Family / weight | Size | LH | Colour | Use |
|---|---|---|---|---|---|
| doctitle | Marcellus 400 | 30px | 1.2 | `#1f2a44` | Company name as document title |
| docsub | Montserrat 500 | 13px | 1.4 | `#5b6675` | "Preliminary Business Health Assessment" |
| h2 | Marcellus 400 | 21px | 1.25 | `#1f2a44` | Section heading |
| h3 | Montserrat 600 | 14px | 1.35 | `#1f2a44` | Sub-heading (sentence case) |
| body | Montserrat 400 | 16px | 1.65 | `#3d4a5c` | Prose |
| th | Montserrat 600 | 12px | 1.35 | `#5b6675` | Table headers |
| td | Montserrat 400 | 14px | 1.45 | `#3d4a5c` | Table cells |
| caption | Montserrat 500 | 12px | 1.4 | `#5b6675` | Notes, footer |
| figure | Montserrat 600 | 44px | 1.0 | `#1f2a44` | Overall score only |
| snum | Montserrat 500 | 12px | 1.0 | `#8794a5` | Section numerals |

### 2.2 Rules

1. **Marcellus appears three times only**: document title, section headings, print cover line. Never in body, tables, chips or figures — at small sizes Marcellus 400 loses legibility.
2. Montserrat carries all data. All figures, all tables, all labels.
3. **No uppercase, no letter-spacing** anywhere (site rule in `references/typography.md`). Write `Moderate`, not `MODERATE`.
4. **Tabular figures on every number**: `.bmr-report-table--num`, `.bmr-report-score__figure`, band ticks, metagrid values → `font-variant-numeric: tabular-nums`. Montserrat ships proportional figures; without this the columns wobble.
5. **Measure**: `.bmr-report-prose { max-width: 68ch }`; tables and the score block may fill the 664px column, never more. 68ch sits inside the 45–75 CPL band, near Bringhurst's 66.
6. Heading/body size ratio never below 1.31 (21/16). Do not flatten the hierarchy.
7. Paragraph `margin-bottom: .85em`, no first-line indent. Layout must survive WCAG 1.4.12 (LH 1.5 / para 2× / letter .12em / word .16em) — so no fixed-height prose boxes, no `overflow:hidden` on prose.
8. Print sizes are literal `pt` (§8), not scaled px: 22 / 13 / 10.5 / 9 / 8. Body never below 10pt (below 9pt is a documented low-vision barrier).

### 2.3 Forbidden

`<h1>` inside the report, `font-weight` 300/800/900 below 20px, `text-shadow`, any `<i class="bi …">`, `text-align: justify`.

---

## 3. Colour policy

### 3.1 Three roles

| Role | Values | Where |
|---|---|---|
| Ink | `#1f2a44` heads / `#3d4a5c` body / `#5b6675` secondary | everywhere |
| Structure | `#d9e2ec` hairline, `#eef1f5` stripe, `#f2f6fb` band | rules and surfaces only |
| **Data accent A (red)** | text `#a12b2b`, tint `#fbf0f0`, border `#e3c4c4` | Critical/High, Critical band, High likelihood |
| **Data accent B (amber)** | text `#96590a`, tint `#fbf3e4`, border `#ecd9b6` | Medium, Vulnerable band, Moderate likelihood |
| Interactive | `#0b5ed7`, hover `#0846a8` | links, CTA, focus ring — **never data** |

**Accent count in the report body: two (red, amber), plus brand blue reserved for interactive elements.** No green, no sky, no violet, no yellow-fill chip. "Good / Strong / Low / Minor" is neutral ink plus a word.

### 3.2 Single severity ramp

| Value | Text | Fill | Border |
|---|---|---|---|
| gap `High`, risk `Critical`, band `Critical` | `#a12b2b` | `#fbf0f0` | `#e3c4c4` |
| gap `Medium`, risk `Moderate`, band `Vulnerable` | `#96590a` | `#fbf3e4` | `#ecd9b6` |
| gap `Low`, risk `Minor`, pillar `Good` | `#5b6675` | `#ffffff` | `#d9e2ec` |
| band `Moderate` | `#1f2a44` | `#eef1f5` | `#d9e2ec` |
| band `Strong` | `#1f2a44` | `#ffffff` | `#1f2a44` |

Colour is never the only signal (WCAG 1.4.1): every chip prints its word; the band prints its name. **Deliberate asymmetry: Strong is not green.** 82/100 and 41/100 differ by section content and by the band word, not by hue.

### 3.3 Verified pairs (AA)

| Pair | Ratio | Use |
|---|---|---|
| `#1f2a44` / `#3d4a5c` on `#ffffff` | 14.26 / 9.00 | headings / body |
| `#5b6675` on `#ffffff` | 5.83 | captions |
| `#5b6675` on `#eef1f5` / `#f2f6fb` | 5.15 / 5.37 | stripe / band |
| `#a12b2b` on `#fbf0f0` | 6.50 | red chip |
| `#96590a` on `#fbf3e4` | 5.11 | amber chip |
| `#ffffff` on `#0b5ed7`, `#0b5ed7` on `#ffffff` | 5.84 | CTA / link |
| `#d9e2ec` on `#ffffff` | 1.31 | **fails 3:1 — decorative rules only**, never a boundary or focus ring |
| `#8794a5` on `#ffffff` | 3.08 | numerals and 18px+ only |

Focus ring: `outline: 2px solid #0b5ed7; outline-offset: 2px` → 5.84:1, clears the 3:1 non-text rule.
**No gradients, no `box-shadow`, no `border-radius: 50%`, no `filter`** inside the report.

---

## 4. Document layout

### 4.1 Page shell

| Property | Screen | Print |
|---|---|---|
| Sheet width | `max-width: 760px` | `100%` of page box |
| Sheet padding | `48px` (≥1024) / `32px` (768–1023) / `20px 18px` (<768) | `0` (margins on `@page`) |
| Content column | `664px` | `174mm` (210 − 36) |
| Border / radius / shadow | `1px #d9e2ec` / `2px` / none | none / `0` / none |
| Section separation | `1px #d9e2ec` + `28px` above, `40px` below | same + `break-inside: avoid` |

Breakpoints 1024 / 768 / 576.

### 4.2 Masthead (replaces `.report-header-banner`)

Flat white, four slots, no fill:

```
BOOK MY RECORDS · BUSINESS ADVISORY            Report ID
                                               BMR-2026-11-0007      ← 12px/500 #5b6675, rule under
Meridian Precision Components Pvt Ltd                                ← doctitle, Marcellus 30px
Preliminary Business Health Assessment                               ← docsub
Assessment date | Industry | Turnover band | Prepared by             ← metagrid, 4 cells, rule above
17 Nov 2026     | Mfg      | ₹1–5 Cr       | BMR Advisory
Basis of assessment · Sections 1–4 of 9 · Confidential               ← kicker, 12px
```

"Prepared by" = static `BookMyRecords Advisory` (no consultant name exists at render time; do not invent one). The old red "Consultant review pending" pill becomes the plain kicker `Preliminary — subject to consultant review`.

### 4.3 Section order + JSON mapping

Numerals are literal text in `.bmr-report-snum`, not CSS counters — they survive print, copy-paste and screen-reader order deterministically.

| § | Section | JSON keys | Gated |
|---|---|---|---|
| — | Masthead + kicker | `meta.*` | visible |
| 1 | Basis of Assessment | `meta.industry`, `meta.turnover_band`, `_meta.compliance`, `_meta.document_attached`, `_meta.processed_at` | visible |
| 1.1 | Scope and method | `_meta.engine`, `meta.assessment_date` | visible |
| 1.2 | Information not verified | `missing_or_unverified_info[]` | visible |
| 2 | Executive Summary | `executive_summary` | visible |
| 3 | Health Score | `scores.overall_score`, `scores.risk_band`, band description | visible |
| 3.1 | Pillar scores | `scores.pillar_scores[]` | visible |
| 4 | Findings — 4.1 Strengths / 4.2 Critical Gaps / 4.3 Observations | `key_strengths[]`, `critical_gaps[]`, `key_observations[]` | first 2 of 4.1, first 2 of 4.2; 4.3 locked |
| 5 | Risk Register | `risks_and_vulnerabilities[]` | locked |
| 6 | Improvement Opportunities | `improvement_opportunities[]` | locked |
| 7 | Priority Action Plan | `priority_action_plan.immediate_30/medium_term_60/strategic_90_days` | locked |
| 8 | Recommended Consultation Agenda | `consultation_agenda[]` | locked |
| 9 | Next Steps and Full Report | `disclaimer`, CTA, booking | **visible** |
| — | Footer line | `meta.report_id`, `meta.assessment_date`, page no. | visible |

Rationale: basis → verdict → evidence → risks → actions → how to get the rest. The score is §3 because a memo states the conclusion before the workings. `key_observations` is evidence, so it sits inside Findings rather than standing alone. The CTA is §9 only, so it reads as the document's next step rather than a sales block appended to it.

**Explicitly not in the document:** thank-you block, methodology essay, about-us, testimonials, feature bullets, chart gallery, "how scoring works" panel.

### 4.4 Section header pattern

```
1 ── Basis of Assessment ────────────────────────────────────
```
`.bmr-report-shead`: flex, baseline, `gap:12px` — numeral (`.bmr-report-snum`, `min-width:18px`), `h2`, then `.bmr-report-shead__rule { flex:1; height:1px; background:#d9e2ec; transform:translateY(-4px) }`. Sub-headings indent `30px`.

**Footer** `.bmr-report-foot` (12px `#5b6675`, 1px top rule, `margin-top:40px`):
`BMR-2026-11-0007 · BookMyRecords Advisory, 107 Silver Arc Plaza, Janjeerwala Square, Indore 452001 · +91 96696 93315`

---

## 5. Score presentation

Delete the 140px ring. Two elements, ~320px tall, no circles.

```
66.7   Moderate                     ├───┼───┼───┼───┼───┤
────   Solid fundamentals with      0  40  60  80  100
/100   clear operational, margin        ▲ 66.7
       or compliance gaps.
```

**5.1 Score block** `.bmr-report-score`: two columns (140px fixed figure / fluid text), `border-top: 1px solid #1f2a44; border-bottom: 1px solid #d9e2ec; padding: 20px 0` — a ruled band, not a card. Figure 44px Montserrat 600 `tabular-nums`, `/100` beneath at 12px `#5b6675`. Band word at 14px/600 in the mapped data colour, then `report-risk-band-desc` at 15px body. The 44px figure appears **once** in the whole report; nothing else exceeds 30px.

**5.2 Band scale** `.bmr-report-bandscale`: track `height:10px`, four flex segments `40/20/20/20%` filling `#f6e6e6`, `#f8efe1`, `#eef1f5`, `#ffffff`, each `1px #d9e2ec` outline, no text inside. Marker `2px × 18px` in `#1f2a44` at `left: calc(var(--score) * 1%)` with a `6px` caret label above reading the score in 12px. JS writes `--score` as an inline custom property — **never a `width` string**. Ticks `0 · 40 · 60 · 80 · 100` beneath in 12px `tabular-nums`; band names centred under segments, dropped under 576px.

**5.3 Pillars → table, not bars** (a bar and a table answer the same question; the table answers precisely). `.bmr-report-table--num`, columns `Pillar | Score | Max | % | Status`, numeric columns right-aligned, one decimal on `%`. Status is the word in the mapped colour — no chip.

---

## 6. Gating

### 6.1 Visible vs locked

| Region | Treatment |
|---|---|
| Masthead, §1, §2, §3, §9 | fully rendered |
| §4.1, §4.2 | first **2** items each |
| §4.3, §5, §6, §7, §8 | not rendered; wrappers exist with `hidden` |
| Booking (§9) | visible |

Honesty rule: the count is derived from the JSON (`5 further items across 4 sections`), never rounded up or invented. If the arrays hold fewer items than the visible slice, that section renders complete and drops out of the count; if the count reaches zero, hide the lock entirely and unhide everything — never show a lock with nothing behind it.

### 6.2 The cut

```
… 2 rendered items …
┌────────────────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ← 5 skeleton rules, 8px, #eef1f5,
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░                  │   radius 2px, mask fades to transparent
├────────────────────────────────────────────┤
│ The full report continues                   │
│ Sections 5 to 8 — risk register, …          │
│ 5 further items across 4 sections.          │
│ Your email and phone number are already     │
│ on file. …                                  │
│ [ Book the 30-minute review call ]          │
│ Prefer a PDF now? Print this summary        │
└────────────────────────────────────────────┘
```

- `.bmr-report-locked { border-top: 1px solid #1f2a44; padding: 24px 0 8px; background: #fff }` — no box, no shadow, no radius. It reads as the sheet continuing and then stopping hard.
- `.bmr-report-locked__veil` (`aria-hidden="true"`, `height:88px`, flex column `gap:10px`, `mask-image: linear-gradient(180deg,#000 0%,transparent 88%)`) holds five `.bmr-report-locked__line` divs at widths 100/92/96/74/45%, `height:8px`, `#eef1f5`, `radius 2px`. **The veil is decoration with no text nodes.**
- No padlock graphics, no `filter: blur()` on real content, no fake paragraphs, no `overflow:hidden` over live DOM.

### 6.3 Wording (verbatim; plain on purpose)

- Title: **"The full report continues"**
- Body: **"Sections 5 to 8 — risk register, improvement opportunities, the 30/60/90 action plan and the consultation agenda — are completed with a consultant."**
- Count: **"5 further items across 4 sections."** (JS-computed)
- Reassurance: **"Your email and phone number are already on file. We use them to send the full report after the review call — nothing else."**
- Banned: "Unlock", "Upgrade", "Premium", "Exclusive", "instant access", countdowns, scarcity. There is no payment in this flow and the copy must not imply one.

### 6.4 One CTA

Primary `.bmr-report-cta__button`, label **"Book the 30-minute review call"**, a real `<button type="button">` (not `<a>`, not `role="button"`), with `aria-controls="booking-block"`. On click: `showAnalysisView('booking')` → `.focus({preventScroll:true})` on the booking `<h3 tabindex="-1">` → `scrollIntoView({block:'start',behavior:'smooth'})`. Honour `prefers-reduced-motion` by dropping the smooth behaviour.

Secondary, 13px plain text: **"Prefer a PDF now? Print this summary"** → `window.print()`. This is the honest fallback — the visitor keeps the partial report. Button styled as a link, no border/fill, `#5b6675`, never competing with the primary.

CTA appears **once**. `#btn-go-to-booking` moves here from `.report-actions`; the id move keeps `checkup.js`'s existing listener working untouched. One text-only cross-reference is allowed: `Full detail in §5.` at 13px — a reference, not a second CTA.

### 6.5 Accessibility contract

| Requirement | Implementation |
|---|---|
| Locked text never reaches AT | gated wrappers carry `hidden` (out of a11y tree); `renderReport()` still fills them, so no id or logic changes |
| Veil is silent | `aria-hidden="true"`, zero text nodes |
| Explanation is real text | normal `<p>` inside `<section aria-labelledby="…">` |
| CTA focusable and announced | real `<button>`, visible `2px #0b5ed7` ring, label states the action |
| Focus moves somewhere sensible | booking heading, not page top |
| No motion trap | no autoplay, no scroll-jack; reduced-motion kills smooth scroll and veil fade |
| Colour-independent | chips and bands always print their word |

---

## 7. Booking block (§9)

Relationships note: the platform is **Cal.com**, not Calendly (`docs/CONSULTATION_BOOKING.md` already selected Cal.com). Avoid both brand names in body copy; call it "the booking calendar".

- **Shell** `.bmr-report-booking { border-top:1px solid #d9e2ec; padding-top:24px; margin-top:32px }`, no card. Inside the report scope neutralise the widget chrome: `.bmr-report .cal-embed-wrapper { border:0; box-shadow:none; padding:0 }`.
- **Copy above the embed** (13px `#5b6675`, ~60ch): *"Pick a slot below. The call runs 30 minutes, is free of charge, and covers the findings in §4 and the priority actions. Your name, email and report ID are pre-filled."*
- **Hide the event-details card** (`hideEventTypeDetails: true`) — the heading and copy already carry title and duration; the duplicate card is what makes an embed look bolted on.
- **Prefill** (already implemented, keep): `name`, `email`, `notes = "Report ID: … | Company: … | Phone: …"`. Do not pass `phone` top-level — it only works if the event type has a phone field.
- **Theme** — replace `styles.branding` with CSS variables:
  ```js
  Cal("ui", { theme: "light", hideEventTypeDetails: true,
    cssVarsPerTheme: { light: {
      "cal-brand": "#0b5ed7", "cal-brand-emphasis": "#0846a8", "cal-brand-text": "#ffffff",
      "cal-text": "#3d4a5c", "cal-text-emphasis": "#1f2a44", "cal-text-subtle": "#5b6675",
      "cal-bg": "#ffffff", "cal-bg-subtle": "#f2f6fb", "cal-bg-muted": "#f7f9fc",
      "cal-border": "#d9e2ec", "cal-border-subtle": "#eef1f5",
      "radius": "2px", "spacing": "1px" } } });
  ```
  `radius: 2px` and `spacing: 1px` are the two values that stop it looking like consumer SaaS.
- **Re-mount guard**: `initCalBooking()` runs on every CTA click plus a 500ms pre-init, and each `Cal("inline", …)` appends another iframe. Add `state.calMounted` and mount once.
- **Fallback** (ad-blockers): keep the direct link and phone link, restyled as one row of 13px text links — the calendar is the primary path.
- **Print**: `#booking-block` and `.bmr-report-booking` hidden; one print-only sentence replaces them (§8).

---

## 8. Print stylesheet (append; leave the existing block alone)

```css
@page { size: A4 portrait; margin: 20mm 18mm 22mm; }
@media print {
  .bmr-report { font-size: 10.5pt; }
  .bmr-report-doc { max-width: none; border: 0; padding: 0; box-shadow: none; }
  .bmr-report-prose, .bmr-report-table { max-width: none; }
  .bmr-report-title { font-size: 22pt; }
  .bmr-report-shead h2 { font-size: 13pt; }
  .bmr-report-table { font-size: 9pt; }
  .bmr-report-note, .bmr-report-foot { font-size: 8pt; }
  .bmr-report-section, .bmr-report-score, .bmr-report-table tr,
  .bmr-report-locked, .bmr-report-plan__phase { break-inside: avoid; page-break-inside: avoid; }
  .bmr-report-shead, h2, h3 { break-after: avoid; page-break-after: avoid; }
  p, li { orphans: 3; widows: 3; }
  .bmr-report-screen-only, #booking-block, .cal-embed-wrapper,
  .bmr-report-locked__veil, .report-actions, .wizard-step-actions { display: none !important; }
  .bmr-report-print-only { display: block; }
  .bmr-report-locked { border-top: 1px solid #1f2a44; }
  .bmr-report a[href]::after { content: " (" attr(href) ")"; font-size: 8pt; color: #5b6675; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
```

- `@page` size and margins are mandatory: Chromium's ~10mm default makes a sheet read like a web page. 20/18/22mm yields the 174mm measure.
- **Locked region in print**: never print blur or skeletons. Print title + body + count, plus the print-only line *"The full report (sections 5–8) is issued by email after the 30-minute review call."* followed by `BookMyRecords Advisory · +91 96696 93315`.
- Steps 1–3 must not print; `.wizard-step-pane` is already `display:none` when inactive and the header is already hidden by the existing block — do not duplicate those rules.
- **Page numbering** is progressive enhancement only, because Chromium ignores `@page` margin boxes:
  ```css
  @page { @bottom-center { content: counter(page) " / " counter(pages);
    font: 8pt Montserrat, sans-serif; color: #5b6675; } }
  ```
  No layout may depend on it; `.bmr-report-foot` carries id + date.

---

## 9. Class inventory — prefix `bmr-report` (50 entries: base classes, BEM elements, 5 modifiers)

All rules are written `.bmr-report .x` / `.bmr-report.x`, so nothing can leak. Radius `2px` on sheet, chips, buttons, skeleton lines; `0` everywhere else.

| Class | Purpose / key values |
|---|---|
| `.bmr-report` | Root scope; declares type tokens and palette |
| `.bmr-report-doc` | The sheet: `max-width 760`, `padding 48`, `1px #d9e2ec`, radius 2 |
| `.bmr-report-masthead` | Header block, `border-bottom 1px #1f2a44` |
| `.bmr-report-masthead__line` | Brand left / report id right, `12px #5b6675` |
| `.bmr-report-title` | Company name, Marcellus 30/1.2 |
| `.bmr-report-subtitle` | Document type, 13px/500 `#5b6675` |
| `.bmr-report-kicker` | Basis/classification caption under masthead |
| `.bmr-report-metagrid` | 4-col `dl`, `gap 16px 24px`, `border-top 1px #d9e2ec` |
| `.bmr-report-metagrid__k` | Label, `12px/600 #5b6675` |
| `.bmr-report-metagrid__v` | Value, `14px #1f2a44`, tabular-nums |
| `.bmr-report-section` | Section wrapper, `margin-top 40`, `break-inside avoid` in print |
| `.bmr-report-shead` | Heading row, flex baseline gap 12 |
| `.bmr-report-snum` | Numeral, `12px/500 #8794a5`, `min-width 18` |
| `.bmr-report-shead__rule` | `flex:1; height:1px; #d9e2ec` |
| `.bmr-report-sub` | Sub-heading, `14px/600 #1f2a44`, indent 30 |
| `.bmr-report-prose` | Body column, `68ch`, `16/1.65 #3d4a5c` |
| `.bmr-report-score` | Score band, rules top+bottom, `padding 20px 0` |
| `.bmr-report-score__figure` | 44px/600 Montserrat, tabular-nums |
| `.bmr-report-score__of` | `/100`, `12px #5b6675` |
| `.bmr-report-bandscale` | 10px track holder, `position: relative` |
| `.bmr-report-bandscale__marker` | `2×18px #1f2a44` at `left: calc(var(--score)*1%)` |
| `.bmr-report-table` | `width 100%`, `border-collapse`, `14/1.45` |
| `.bmr-report-table--num` | tabular-nums, right-align numeric `th/td` |
| `.bmr-report-th` | `12px/600 #5b6675`, `border-bottom 1px #1f2a44`, `padding 6px 10px` |
| `.bmr-report-td` | `padding 9px 10px`, `border-bottom 1px #eef1f5` |
| `.bmr-report-td--num` | Right-aligned numeric cell |
| `.bmr-report-sev` | Severity chip: `12px/500`, `padding 2px 8px`, `border 1px`, radius 2 |
| `.bmr-report-sev--high` / `--medium` / `--low` | The three §3.2 pairs; default neutral |
| `.bmr-report-kv` | Strength/gap entry, `padding 12px 0`, hairline under |
| `.bmr-report-kv__title` | `14px/600 #1f2a44` |
| `.bmr-report-kv__body` | `14/1.55 #3d4a5c` |
| `.bmr-report-list` | Observations, `list-style:none`, `::before` counter in `#8794a5` |
| `.bmr-report-plan` | 3-col grid gap 24, 1 col <768 |
| `.bmr-report-plan__phase` | Phase column, hairline top, `padding-top 12` |
| `.bmr-report-plan__label` | `30 days` / `60 days` / `90 days`, `12px/600 #5b6675` |
| `.bmr-report-locked` | Locked shell, `border-top 1px #1f2a44` |
| `.bmr-report-locked__veil` | `aria-hidden` mask fade |
| `.bmr-report-locked__line` | One 8px `#eef1f5` skeleton rule |
| `.bmr-report-locked__title` | "The full report continues", h3 role |
| `.bmr-report-locked__body` | Lock copy, `15/1.6 #3d4a5c`, `60ch` |
| `.bmr-report-cta` | CTA cluster, column, gap 10 |
| `.bmr-report-cta__button` | `#0b5ed7` bg, white 14/600, `padding 12px 20px`, radius 2, focus ring |
| `.bmr-report-cta__aside` | Secondary print link, `13px #5b6675`, underline on hover |
| `.bmr-report-booking` | Booking shell, hairline top, no card |
| `.bmr-report-booking__intro` | `13px #5b6675`, `60ch` |
| `.bmr-report-booking__fallback` | Text-link row for blocked embeds |
| `.bmr-report-note` | Footnote, `12px #5b6675` |
| `.bmr-report-foot` | Footer line, `12px #5b6675`, hairline top |
| `.bmr-report-screen-only` | Hidden in print |
| `.bmr-report-print-only` | `display:none` on screen, `block` in print |

---

## 10. Migration checklist

**10.1 `checkup.html`, inside `#analysis-report`**

1. Add `class="bmr-report"` to `#analysis-report`; wrap content in `.bmr-report-doc`. Keep its `hidden` attribute.
2. Swap `.report-header-banner` for `.bmr-report-masthead`, **keeping** `report-company-name`, `report-id-display`, `report-date-display`, `report-industry-display`, `report-turnover-display` (reparent into metagrid cells). Delete the "Evaluation Status" cell → becomes the kicker.
3. Delete `.report-score-gauge-card` and the pillar-card wrapper. **Keep `id="report-score-circle"`** on the new figure container — `renderReport()` still sets `className = "score-circle-display band-x"`, which §10.3 neutralises.
4. **Keep `report-risk-band-pill`** on the band word (now plain text) and `report-risk-band-desc` on the paragraph beside it.
5. Add band-scale markup (§5.2) — no ids needed from JS.
6. Convert each block to `.bmr-report-section` + `.bmr-report-shead` with literal numerals 1–9 (1.1/1.2/3.1/4.1/4.2/4.3 as `.bmr-report-sub`), keeping every container id on the same node.
7. Wrap §1–§4; add gated wrappers `id="report-s43"…"report-s8"` with `hidden`, each containing its container id:
   ```html
   <div class="bmr-report-locked" id="report-locked">
     <div class="bmr-report-locked__veil" aria-hidden="true">…5 lines…</div>
     <h3 class="bmr-report-locked__title">The full report continues</h3>
     <p class="bmr-report-locked__body">…</p>
     <p class="bmr-report-locked__body" id="report-locked-count">…</p>
     <div class="bmr-report-cta">
       <button type="button" id="btn-go-to-booking" class="bmr-report-cta__button"
               aria-controls="booking-block">Book the 30-minute review call</button>
       <button type="button" id="btn-print-partial" class="bmr-report-cta__aside">
         Prefer a PDF now? Print this summary</button>
     </div>
   </div>
   ```
8. `.report-actions`: keep `#btn-print-report` and `#btn-retake-checkup` (styled `.bmr-report-cta__aside`); **remove** the old `#btn-go-to-booking` element (the id now lives in §7). Keep `class="report-actions no-print"` so existing print rules still hide it.
9. `#booking-block`: keep id + `hidden`. Replace its badge/heading cluster with `.bmr-report-booking` + `__intro`; keep `#cal-inline-embed`, fallback links, `#btn-back-to-report`.

**10.2 `assets/js/checkup.js`**

1. In `renderReport()`: slice `key_strengths`/`critical_gaps` to 2; emit `.bmr-report-kv` instead of `.strength-card`/`.gap-card`; emit `.bmr-report-sev--{high|medium|low}` instead of `badge bg-danger` etc.; **remove every `<i class="bi …">` from report markup**.
2. Emit pillar rows as `<tr>` with `.bmr-report-td` / `--num` instead of `.pillar-progress-card`; `%` to one decimal.
3. `document.querySelector('.bmr-report-score').style.setProperty('--score', String(overallScore))` — no width strings.
4. Add `updateLockedState(report)`: compute `total` and `spanSections` from the remaining items, write the count line, `hidden = total === 0`, and unhide the gated sections when it is 0.
5. Keep the `#btn-go-to-booking` handler, then append focus + scroll (§6.4). Add `#btn-print-partial` → `window.print()`.
6. `initCalBooking()`: `if (state.calMounted) return;` then set the flag after `Cal("inline", …)`; replace `ui.styles.branding` with `cssVarsPerTheme` + `hideEventTypeDetails: true` (§7). Leave `calLink: "bookmyrecords/checkup-consultation"` untouched.
7. Do not touch `escapeHtml`, submission, validation, or `showAnalysisView` beyond the focus call.

**10.3 `assets/css/bmr-ds.css`** — append only

1. One commented block `/* ===== BMR report document (AI_REPORT_DESIGN.md) ===== */` holding all §9 classes scoped under `.bmr-report`.
2. Append these neutralisers (JS reuses old class names on the same nodes):
   ```css
   .bmr-report .score-circle-display { width:auto; height:auto; border:0; border-radius:0; display:block; margin:0; }
   .bmr-report .risk-band-pill { padding:0; background:none; border-radius:0; text-transform:none; letter-spacing:0; }
   .bmr-report .report-header-banner { background:none; color:inherit; padding:0; border-radius:0; }
   .bmr-report .cal-embed-wrapper { border:0; box-shadow:none; padding:0; }
   .bmr-report .badge { padding:0; background:none; color:inherit; font-size:inherit; }
   ```
3. `@page` goes **outside** `@media print`; the new `@media print` block goes last, after the existing one. Lines 1168–1199 stay untouched.
4. Verify: every non-`.bmr-report` page renders byte-identically; the prefix guarantee is that `.bmr-report` heads every selector.

---

## 11. Data contract (unchanged — no schema work required)

```
meta { company_name, industry, turnover_band, assessment_date, report_id }
scores { overall_score, risk_band, pillar_scores[] { pillar_name, score, max_score, status } }
executive_summary, key_strengths[] {title, explanation}
critical_gaps[] {pillar, finding, impact, severity}
key_observations[]
risks_and_vulnerabilities[] {risk_title, likelihood, impact_severity, mitigation}
improvement_opportunities[] {initiative, expected_outcome, timeframe}
priority_action_plan { immediate_30_days[], medium_term_60_days[], strategic_90_days[] }
consultation_agenda[], missing_or_unverified_info[], disclaimer
_meta { engine, compliance, processed_at, document_attached }
```

Pillar weights and risk bands (80/60/40 thresholds) remain as specified in `TECHNICAL_FLOW.md`; this document changes presentation only.

**Open decisions for the owner** — defaults taken here, do not guess in code:
`improvement_opportunities` overlaps the 30/60/90 plan (keep both, §6 is first to cut) · §1.2 stays visible because a partial data set must not look complete · masthead says "BookMyRecords Advisory" until a consultant is assigned · no watermark on the printed partial, the "Preliminary" kicker is enough.

---

## 12. Sources

1. MDN — `@page` at-rule: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@page
2. MDN — Printing / `@media print`: https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Media_queries/Printing
3. W3C WAI — SC 1.4.3 Contrast (Minimum): https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum
4. W3C WAI — SC 1.4.12 Text Spacing: https://www.w3.org/WAI/WCAG21/Understanding/text-spacing.html
5. W3C WAI-ARIA APG — Disclosure pattern: https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
6. Section508.gov — Accessible fonts and typography (15–16px body, 9pt print floor, serif fine for headings): https://www.section508.gov/develop/fonts-typography/
7. UXPin — Optimal line length (45–75 CPL, 66 target): https://www.uxpin.com/studio/blog/optimal-line-length-for-readability/
8. UI-Patterns — Paywall pattern (freemium/taxometer; non-monetary "permission" gates): https://ui-patterns.com/patterns/Paywall
9. NN/g — Deceptive patterns (what lock copy must avoid): https://www.nngroup.com/articles/deceptive-patterns/
10. Cal.com — Customize embed with CSS variables: https://cal.com/docs/developing/guides/embeds/customize-embed-css-variables
11. Cal.com — Embed instructions (`inline`, `ui`, `hideEventTypeDetails`): https://cal.com/help/embedding/embed-instructions
12. Slideworks — Action titles (headline states a conclusion): https://slideworks.io/resources/how-to-write-action-titles-like-mckinsey
13. Deckary — Consulting document standards (one message per unit, restrained palette): https://deckary.com/blog/consulting-slide-standards
14. MDN — `font-variant-numeric`: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/font-variant-numeric
15. CMA Data Online — CMA report format, Forms I–VI (Indian credit-appraisal structure): https://www.cmadataonline.com/blog/cma-data-report-format-explained-forms.html
