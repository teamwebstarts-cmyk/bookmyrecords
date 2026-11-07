# Assets & Icons

Locations relative to the repo root. All verified present (README.md: "Every resource … was recovered and verified present").

## Fonts

- **Web fonts via Google Fonts `@import`** (style.css:81): Marcellus (400 only) + Montserrat (300,400,500,600,700,800,900 + italics). Loaded from `fonts.googleapis.com` — needs network; no local font files for these two.
- **Icon fonts (local):**
  - `assets/fonts/boxicons.{eot,ttf,woff,woff2,svg}` + `assets/css/boxicons.min.css` → `bx bx-*` classes (search, socials `bx bxl-facebook/twitter/linkedin/instagram-alt`, chevrons `bi bi-chevron-right` spill etc.).
  - `assets/css/bootstrap-icons.css` + `assets/css/fonts/bootstrap-icons.woff2/.woff` → `bi bi-*` (star-fill, star-half, plus, chevron-right, `\f145` circle-arrow used by back-to-top ::after, `\f2ea`/`\f4fe` dropdown toggles).
  - `assets/css/fonts/slick.{eot,ttf,woff,svg}` — slick arrows font (vendor slider only).
- Reference rule: **use `bi-*` (Bootstrap Icons) or `bx-*` (Boxicons) classes for small UI icons; use inline SVG for arrows/illustrative glyphs** (the template hand-codes arrow SVGs inline everywhere — see SKILL.md recipe; icons are thin 12–16px geometric strokes with `fill` switching by state).

## Logos (`assets/img/`)

| File | Use |
|---|---|
| `black-logo.svg` | header (dark bg version at 214px) |
| `white-logo.svg` (home1) | overlaid center of testimonial image |
| `footer-logo.svg` | footer logo tile |
| `sm-logo.svg` | favicon |
| `clutch-logo.svg` (home1) | review badge |
| `client-logo1–6.png` (home2) | marquee band |

## Section imagery

- `assets/img/home6/`: `bacground-img.png` (banner texture), `contact-bg.png`, `services-01..04.jpg` (cover slider, min-h 280px), `people-01..04.png`, `testi-left-01.jpg`, `circle.svg` (video stat ring), `pata.png` (team-card corner ornament).
- `assets/img/home4/`: `country-bg.png` (map bg), `australia.png` (flag chip), `Graph.png` (mini chart in location card), `testimoial-bg.png`.
- `assets/img/home2/`: `blog-img-01..04.jpg`, `client-logo1–6.png`, `cursor-img.png` (custom slider cursor: `.project-slider/.banner2-slider/.casestudy-slider { cursor: url("../img/home2/cursor-img.png"), default }`, 7609/6550/8958).
- `assets/img/home1/`: `industrial-bg.jpg`, `contact-bg.jpg`, `white-logo.svg`, `clutch-logo.svg`, `testi-oth-01..04.png`.
- `assets/img/home5/`: `find-job.jpg`, `play-btn.svg`, `video-close.svg`, `banner-bg.jpg`.
- `assets/img/home3/`: `zoom.svg`, `testimonial-shape.png`, `banner-img-01.png`.
- Decorative SVG: `assets/img/inner-pages/Vector/portfolio-single-content-bg.svg` (eg-card4.two center ornament via `content:url(...)` CSS 8838).

## Video

- `assets/video/video-bg3.mp4` (19.7 MB) — the only video; hero of Home 6 + template video sections. Markup idiom (index.html:469): `<video autoplay loop muted playsinline src="assets/video/video-bg3.mp4"></video>` inside `.video-wrapper` with `.video-content-wrap` scrim overlay. No YouTube embeds.

## Image treatment rules (extracted)

- Photos are square-cornered, full-bleed; applied via `<img>` with `object-fit: cover` and explicit `min-height` (280–370px) — no rounded images anywhere except circular avatars.
- Overlay treatments are gradients, not tints: bottom `linear-gradient(0deg, rgba(13,23,32,.6), rgba(13,23,32,.15) 57.57%)` (7541), diagonal `linear-gradient(73deg, rgba(13,23,32,.8), rgba(13,23,32,.1) 60.4%)` (8882), white fade for review strip (5559), full white-wash over banner texture `rgba(255,255,255,.85)` doubled layers (11719).
- Hover treatments: image zoom is NOT used on this page; reveals are overlay/fade/clip based (see animations-and-motion.md).
- Alt text: template leaves `alt=""`/absent on decorative images; keep meaningful alt for content images.

## Adding assets

- Place new images under `assets/img/home6/` (page-scoped folders are the convention: homeN).
- Never swap an existing asset file; add new ones with descriptive kebab-case names.
- SVG ornaments should stay monochrome and inherit `fill` from CSS (`.icon svg { fill: var(--primary-color) }` pattern, e.g. 11777, 6255).
