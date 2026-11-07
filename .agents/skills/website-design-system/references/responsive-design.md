# Responsive Design

Breakpoints verified by tallying all 515 media queries in `assets/css/style.css`. These are explicit, not inferred.

## Breakpoint system (extracted)

| Query | Count | Role |
|---|---|---|
| `max-width: 1699px` | 20 | XL tweak tier (full HD → laptop) |
| `min-width:1400px and max-width:1599px` | 24 | wide-desktop tier |
| `max-width: 1499px` | 23 | laptop tier |
| `max-width: 1399px` | 89 | main laptop tier (77–120px paddings collapse) |
| `max-width: 1199px` | 82 | small laptop (inset paddings → gutter) |
| `min-width:992px and max-width:1199px` | 18 | dedicated tablet-landscape tier |
| `max-width: 991px` | 140 | **tablet portrait / master mobile switch** (nav drawer, topbar removal, dropdowns→accordion) |
| `max-width: 767px` | 91 | large phone |
| `max-width: 576px` | 106 | small phone |
| Sub-576 slick tiers 480/350 | 2 | slider-only (main.js:477–490) |

Swiper uses its own JS ladder: **280 / 386 / 576 / 768 / 992 / 1200 / 1400** (main.js breakpoints objects).

## Desktop (≥1400) baseline

- Fixed header `style-4` inset 4%; banner `padding:260px 0 180px`; sections `100px 0`; `mb-130` rhythm; 4-up grids; inset `.pl--95`.
- Magic cursor active (guard `>1024px`, main.js:712).

## ≤1699 / 1400–1599 / ≤1499 / ≤1399 (shrink tier)

- Header margins 4%→3% (≤1699) →2% (≤1399); logo 214px → `max-width:100%` (≤1399, 3477); nav gap 50→20.
- Inset paddings: 95→70→50→30 (483–499); topbar padding-left 21%→23%→15%→3% (1039–1050).
- Type: card titles 24→22 (≤1399); footer h2 40→30 (≤1499); testimonial padding 100/120→100/80→80/50; eg-card padding `100px 45px→25px`; hero 75→60 only at ≤1199.
- Banner: `260/180`→`200/120` (1400–1599 band)→`180/100` (≤1399) (11723–11731).

## ≤1199 (small laptop)

- `.pl--95/.pr--95` collapse to bootstrap gutter `calc(var(--bs-gutter-x)*0.5)` (499–520).
- Section h2 40→30; hero 75→60.
- Map wrap: bg image removed, `padding:0`; `.country-area` (dots+cards) hidden entirely; counters row → `flex-direction:row; padding:60px 20px` (9713–9731, 9926–9935).
- Nav `li` padding 22px 8px → `22px 0` (1199 gate in every header style).

## ≤991 — the master mobile switch (things that *disappear* here)

Extracted hide patterns (`display:none; visibility:hidden`):
- `.topbar-area` (1056) — top bar gone on mobile.
- Header CTA `primary-btn1` (3530) — replaced by burger `.mobile-menu-btn`.
- Slider button groups that depend on hover/absolute positioning (event rail 12189, testimonial two-plate 5768).
- Desktop hover dropdowns: `li:hover > ul.sub-menu` only fires ≥992 (2047 `min-width:992px` gate); below, sub-menus are static, jQuery accordion via `.dropdown-icon` click (main.js:98–101).

Things that *appear/transform* here:
- `.main-menu` → fixed 280px white left drawer (`transform:translateX(-100%)`, `.show-menu` → 0, `.3s ease-in`; border-right hairline) with mobile logo row + slideUp/slideDown accordions (2086–2141). Trigger: `.sidebar-button` toggles `show-menu` on `.main-menu` (main.js:117–123).
- Mobile menu burger morphs to X (0.5s, 3537–3590).
- Mobile-only contact block under menu list (`d-lg-none d-block` in HTML 164–233: hours, email, phone, primary button).
- Headers keep a hairline `border-bottom: rgba(13,23,32,0.078)` (≥4-color header styles, e.g. 447).
- Sub-menu borders switch to dark-on-white gradient set `linear-gradient(90deg,#525252,#2E448D,#525252)` (1966–1969).

## ≤767 (large phone)

- Type tiers: hero →48, breadcrumb h1 →50, footer-columns unchanged.
- Sections with padded wide gaps: event section flatten — clip-path `polygon(0% 0%…)` (flat), padding 60/20 (12151–12158); decorative rotated bar already hidden ≤1699.
- Vote image of find-job card hidden (11704).
- `.video-content-wrap` padding 70→25 (11962); video h2 50→30 (11990).
- mb-60/70/mt-60/70 → 40 (378–470).
- Card innards: single-column `.title-and-btn` (@576), contact form full width.

## ≤576 (small phone)

- Hero →40; banner author card full width (12293).
- `.w-100` reset inside event section (12325); testimonial fraction pagination becomes inline flex (5769–5777).
- Columns 2→1: `.sulution-approach ul { columns:2→1 }` (7637, 11236).
- Contact form padding 60/20 (10317).

## Slider JS ladders (extracted, main.js)

- `cover-slider-with-progress`: 280:1 / 386:1 / 576:2(sB15) / 768:3(sB15) / 992:3 / 1200:4(sB15) / 1400:4.
- `project-slider`: 280:1 → 768:2 → 992:3 → 1400:4 (spaceBetween 24/30).
- `bolg-slider`: 576:2(sB20) → 768:2(sB30) → 992:3 → 1200:4.
- `casestudy-slider` (slick): 1200:5 arrows off / 991: variableWidth off / 768:1 / 576:1 / 480:1 / 350:1.

## Rules for new responsive work

1. Reuse these exact tiers; do not invent 640/900 etc.
2. Mobile hides use the pair `display:none` **+** `visibility:hidden` (template idiom).
3. Anything hover-powered (dropdowns, overlay reveals, cursor behaviors) must get a tap/click fallback at ≤991 (accordion pattern, main.js:98–101).
4. Typography drops at the documented tiers only (see typography.md).
5. Grids collapse 4→2 (sm) →1 via existing Bootstrap column classes (`col-xl-3 col-lg-4 col-sm-6`); don't add custom CSS grid.
6. Test at 1440×900 and 390×844 against the live page (see README.md verification notes).
