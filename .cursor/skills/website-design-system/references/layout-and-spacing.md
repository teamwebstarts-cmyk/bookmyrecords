# Layout & Spacing

Extracted from `assets/css/style.css` (line refs) and `index.html`.

## 1. Page skeleton (extracted)

```
<body id="body" class="tt-smooth-scroll tt-magic-cursor">
  #magic-cursor > #ball            (custom cursor, desktop >1024px only)
  .circle-container                (back-to-top w/ SVG progress ring)
  <header class="header-area style-4">…</header>
  <div class="banner-area6">…</div>          (hero)
  <div class="<name>-section mb-130">…</div> (repeating content sections)
  <footer>…</footer>
  vendor scripts → assets/js/main.js → inline page script
</body>
```

Sections are `<div>`s (not `<section>`), wrapped in `<!-- Start/End X Section -->` comments (index.html:43–1707).

## 2. Containers (extracted)

- **`.container-fluid.one { max-width: 1746px; }`** (714) — the universal page container. Used on every section.
- **Inset variant:** `.container-fluid.one.pl--95` — `padding-left:95px` desktop, 70 (≤1699), 50 (≤1499), 30 (≤1399), `calc(var(--bs-gutter-x)*0.5)` (≤1199) (483–500). `.pr--95` mirrors it (502–520). Right-side inset + left inset = "text inset from camera-edge" look used on Home 6.
- `.container-fluid.pl--120 { padding-left:120px }` telescoping 50→gutter (717–729).
- Standard Bootstrap `.row`/`col-*` inside; gutters via `g-4`, `gy-5`, `g-lg-4`, `g-xl-4`.

## 3. Spacing scale (extracted utilities)

Section rhythm utility classes (values pt/pb/mt/mb in px), each with built-in responsive drops (style.css:163–470):

| Utility | Desktop | ≤1199 | ≤991 | ≤767 | ≤576 |
|---|---|---|---|---|---|
| `pt-130` / `pb-130` | 130 | 100 | 90 | — | — |
| `pt-120` / `pb-120` | 120 | 100 | 90 | — | — |
| `pt-90` / `pb-90` | 90 | — | 80 | 70 | — |
| `mt-130`/`mb-130`/`mt-120`/`mb-120` | 130/120 | 100 | 90 | — | — |
| `mt-100`/`mb-100` | 110 (!) | — | 80 | — | — |
| `mb-90` | 90 | — | 70 | — | — |
| `mb-60`/`mb-70`/`mt-60`/`mt-70` | 60–70 | — | — | 40 | — |

Small ones flat: 50, 45, 44 (0 ≤991), 40, 35, 30, 25, 20, 15, 10.

**Conventions (observed):**
- Default inter-section gap: **`mb-130`** on the section wrapper (used 10× on the page).
- Header→title gap: `mb-60` or `mb-30` on the title row; components separated inside rows by `g-4`/`gy-5`.
- Section padding (when a bg-colored band): **`padding: 100px 0`** desktop → 90 (≤991) → 70 (≤767) (e.g., 9691, 11221, 12330). Header/bands with tall heroes: `260px 0 180px` (banner6 11718) telescoping to `180px 0 100px` (≤1399).
- Inner panel padding: big panels `80–100px` (testimonial-wrap 5584 `100px 120px`; contact-form-area 10181 `80px 120px` → 60 70 → 60 50 → 60 20 @576); cards `30px` (blog-content 5828), `40px` (team-card 4509), `20px` (location-card 9829); small pills `7px 20px`, chips `4–6px 12–28px`.

Partial "half-height" section overlaps (extracted): video pulled up `margin-top:-210px` over the about band (11941), event strip `margin-top:-250px` (12130), footer subscribe inside 100px-top footer (6218).

## 4. Grid patterns (extracted from index.html usage)

| Pattern | Markup |
|---|---|
| 4-up cards | `col-xl-3 col-lg-4 col-sm-6` (steps — index.html:1054, 1065, 1076, 1087; blog — 1296, 1332) and `col-lg-3 col-sm-6` for people cards (index.html:921) |
| Title row + CTA | `col-lg-12.pl--95 … d-flex flex-lg-nowrap flex-wrap align-items-end justify-content-between mb-60` then `.section-title1` + CTA (index.html:290, 907; mb-30 variant at 1280) |
| Split 1/3–2/3 | `col-lg-4` image • `col-lg-8` slider (testimonial 786) |
| Split 1/2 | `col-xl-6` text • `col-xl-6` cards (success story 490) |
| Inset split | `col-xl-9` map • `col-xl-3` counters (map 549–558); `col-lg-7` form • `col-lg-5` title (contact 1467) |
| Footer | `col-lg-4 col-md-8` + `col-lg-3 col-md-4` + `col-lg-3 col-md-6` + `col-lg-2 col-md-6` (1540–1630) |

Alignment idiom: `d-flex … justify-content-between` for title+CTA rows; `d-flex justify-content-lg-center` inside columns to center child cards; stacks flip `flex-lg-nowrap` → `flex-wrap` with `gap-4`/`gap-5` and `align-items-*` tiered (`align-items-xxl-end align-items-lg-center`, index.html:246).

## 5. Signature structural devices

- **Slider frame**: Swiper + custom rail — `scrollbar-and-slider-btn d-flex … justify-content-between` holding `.progress-pagination2` (6px track `#F4F9FD`, fill `--primary-color`, 11900–11912) and `.slider-btn-group.w-100` (2×40px round btns, style.css:997–1028).
- **Off-grid diagonals**: clip-path polygons & rotated bars (see design-tokens.md §6) — sections deliberately break the grid: `home6-event-section` is `max-width:1740px; margin-left:auto; padding-left:395px; clip-path polygon(15% 0%…)` with absolute vertical prev/next rail (12128–12199).
- **Header inset frame**: `header-area.style-4` absolutely positioned `top:24px`, `.header-wrap { margin:0 4%; border:1px solid #EEE }` (3414–3452) floating over the banner.
- **Sticky pieces**: `section-title1` sticky `top:100px` in home5 portfolio (11215); `position_top` header gets `.sticky` after 200px scroll (main.js:160–168).
- **Z-index ladder (observed):** header 999, dropdowns 99, mobile drawer 99999, magic ball 99999, circle-container 10000.

## 6. Rulebook for new sections

1. Wrapper: `<!-- comment -->` + `<div class="<section-name>-section [bg-modifier] mb-130">`.
2. Inside: `.container-fluid.one` (optionally `.pl--95` / `.pr--95`) → `.row` → Bootstrap cols.
3. First row: section title + CTA (recipes in SKILL.md).
4. Content rows: `g-4`/`gy-5` gutters; 4-up via `col-xl-3 col-lg-4 col-sm-6`.
5. Band backgrounds use `padding:100px 0` (+ 90/70 collapses) with one of the surface colors from design-tokens.md §2.
6. Never set ad-hoc margins like 34px/62px — snap to the utility scale.
