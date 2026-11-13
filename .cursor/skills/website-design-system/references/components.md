# Components

Every component below exists in the codebase; CSS line refs = `assets/css/style.css`, HTML refs = `index.html`. Copy these as bases — do not redesign.

When BMR theme CSS is loaded (`bmr-ds.css`), components use remapped `--primary-color` / `--title-color`; see `bmr-brand-system.md`.

## Buttons & links

### `.primary-btn1` (solid primary) — CSS 836–884
Solid `var(--primary-color)`, text white 15px Montserrat 500, `padding:20px 37px`, `gap:8px`, inline-flex, `line-height:1`, contains diagonal-arrow SVG (`fill:white`) + empty `<span></span>`; `overflow:hidden; position:relative; z-index:1; transition: all .6s`.
Hover: hidden circle span (absolute, `border-radius:50%`, white, `translate(-50%,-50%)`) expands to `width:225%; height:1000.5px` from cursor entry point (main.js:1058–1071 sets span coords on mouseenter/out), text+icon flip to primary.
Variants: `.btn-hover` same ripple; header size `padding:16px 28px` (1539) / 15px (3524). `.primary-btn2` = inverse (white bg, primary ripple, CSS 885–927).

### `.explore-btn` (text link w/ arrow) — CSS 930–991
Montserrat 500 15px, `--title-color`, flex baseline `gap:8px`, transition .35s. Hover: color + SVG `fill` → primary, arrow rotates **45deg**. `.two`: bordered box (`1px solid #EEE`, `padding:11px 28px`) with primary ripple like btn1 (944–986). `.white`: all-white for dark bg.

### Slider nav buttons — CSS 997–1029
40×40 round, white bg, `1px solid rgba(217,217,217,0.9)`, arrow SVG 15×11 fill primary; hover → primary bg + white arrow; `.swiper-button-disabled` opacity .2. Group: `.slider-btn-group` flex space-between (w-100 = 100px min). Vertical variant in event section (12182–12190).

## Header (style-4, this page) — CSS 3414+, HTML 43–239

Absolute `top:24px`, full width; `.header-wrap{ display:flex; justify-content:space-between; border:1px solid #EEE; margin:0 4%; gap:30px; transition: all .8s ease-out }`. Left: `.header-logo` (`padding:10px 26px`, logo img 214px `assets/img/black-logo.svg`). Right `.nav-right`: search toggle (16px SVG → `.search-input` dropdown: 600px panel, `padding:50px 30px 30px`, shadow `0 30px 80px rgba(8,0,42,0.08)`, close ×-button 28px circle, search group `border-bottom:1px solid #222`, "Quick Search:" 13px row), lang dropdown (180px list card), `primary-btn1` "Get in Touch", `.sidebar-button.mobile-menu-btn` (3-bar burger, 25/35/15px bars morph to X — CSS 3537–3590).
Menu: `.main-menu > ul.menu-list > li` inline-block `padding:22px 8px`; links Montserrat 500 14px `padding:4px 13px`, `border:1px solid transparent`, `border-radius:15px`, capitalize; hover/active → `border-color: var(--title-color)` (4071-zone mirrors style-1 CSS 1840–2077). Dropdowns: `<i class="bi bi-plus dropdown-icon">` + `ul.sub-menu` (top:68px, min-width 215px, white, hairline border, items `padding:14px 20px`, 13px Montserrat 500, hover → primary + gradient underline sweep `linear-gradient(90deg,#fff,#2E448D,#fff)` scaleX 0→1, .4s ease-in, CSS 1950–1977; reveal `fade-up .45s linear` ≥992px CSS 2047–2063). Nested sub-menus fly out left:100% with the signature shadow.
Mobile ≤991: `.main-menu` becomes fixed 280px left drawer `translateX(-100%)` → `.show-menu` translateX(0), transition transform .3s ease-in (2096–2103); `.dropdown-icon` click = jQuery slideToggle accordion (main.js:98–101).

## Hero banner (Home 6) — CSS 11716–11890, HTML 242–284

`.banner-area6`: bg = `linear-gradient(180deg, rgba(255,255,255,.85), rgba(255,255,255,.85)), url(../img/home6/bacground-img.png)` cover; `padding:260px 0 180px` (→200/120 @1400-1599, 180/100 ≤1399). Left: `h1` 75px Marcellus w/ primary `<span>`, `.quate-text` (42px arrow icon + Marcellus 20px/30px quote), `.btn-group` = `border-top:1px solid #eee; padding-top:30px; gap:30px` holding outline chips (16px Montserrat 400, `1px solid var(--title-color)`, radius 16, `padding:7px 20px`; success-rate chip has 10px dash separator ::after) — CSS 11787–11843.
Right: `.banner-btn.magnetic-item` — 178×178 scalloped SVG blob button; content centered absolute; hover: blob fill → primary, text → white (11845–11881).

## Section title block — CSS 736–827 (details in typography.md + SKILL.md)

## Cover slider card `.eg-card4` — CSS 8762–8862, HTML 304–434

Image card: `.card-img` (mb 35px, img min-height 280px cover) → chip `a` (12px Montserrat 500, `1px solid #0D1720`, radius 15, `padding:4px 12px`, mb 15) → `h4 a` Marcellus 24px → hover primary. Slider: `.cover-slider-with-progress` (main.js:529–568) w/ `.progress-pagination2` + `.slider-btn-group` prev-4/next-4.
Variant `.eg-card3` (overlay card, CSS 8441–8520): full-bleed padding `100px 45px`, right 1px gradient divider, chip `border:1px solid rgba(255,255,255,0.5)` radius 16, `h5 a` Marcellus 40/32px white, paragraph reveal `translateY(100%)→0` + fade (transform .5s, opacity .25s).

## Dark about band `.home6-about-section` — CSS 11914–11937, HTML 439–461

`background: var(--title-color); padding:100px 0 310px` (bottom reserved for overlapping video). Contains white-bordered pill + `.section-title1.white` (white h2, links underlined white; 6733–6741) + white `.explore-btn`.

## Video section `.home6-video-section` — CSS 11940–12010, HTML 463–485

`margin-top:-210px` overlap; `video` full width (`.video-wrapper video` base: `min-height:500px; height:75vh; object-fit:cover`, CSS 7667–7671). `.video-content-wrap`: absolute overlay `rgba(13,23,32,0.25)`, `padding:70px` (25 ≤767), flex align-end. Content: circular accent img + `h2` Marcellus 50px white + `p` Montserrat 500 20px (30/16 mobile).

## Success cards `.team-card` — CSS 4507–4557, HTML 487–540

Flat card `#EFEAE6` (`two` variant `#DAE6F2`), `padding:40px` (25 ≤1399), `min-height:350px`, flex column space-between; decorative `::after` = pata.png corner mark (removed on `.two`); `h4` Marcellus 24px, `p` Montserrat 500 14px/22px; `.explore-btn` footer. Row: `col-sm-5` + `col-sm-7`.

## Country map & counters `.map-wrap` — CSS 9706–9955, HTML 542–780

`map-wrap` bg `country-bg.png` cover, `padding:70px` (0 ≤1199). `country-area > ul > li` absolutely-placed hotspots (`:nth-child` coordinates 9736–9775). Dot: `.dot-main` + 3× `.waves` 35px blurred circles, `animation: waves 3s ease-in-out infinite`, delays 0/1s/2s (9784–9821). `.location-card`: 275px white card radius 10, hairline border, tooltip triangle ::after (18px rotated square), `transform: translateX(-50%) scale(0)` → `scale(1)` when `li.active` (transition .5s). Card innards: country chip (primary bg white 14px 500, radius 5, `padding:4px 10px`), year chip (`#F3F4F5`, `1px solid rgba(46,68,141,0.1)`), status chips (white pills 12px, radius 12.5) + Graph.png.
JS: default first li `.active`; mouseenter on li activates it & deactivates siblings; mouseleave of the area restores first (main.js:4–30).
Counters `ul.counter-wrap`: `border:1px solid #EEE; padding:80px 40px` column (row 60/20 ≤1199); `.single-counter` = 40px icon SVG + `h2.counter` + `<span>+</span>` + caption; h2 animated by CounterUp (`delay:10, time:1000`, main.js:113–116).

## Testimonial — CSS 5584–5800, HTML 781–900

Wrap `.testimonial-wrap.two`: `#F4F9FD`, `padding:100px` (80/50/60/40/20 telescoping 5588–5600). Left `col-lg-4` `.testimonial-img-with-logo.two` (5526–5580): full-height image, white-gradient bottom band `.review-area` (`linear-gradient(283deg,#FFF 0%,rgba(255,255,255,0) 84.53%)`, `padding:50px 40px`, ≤991 30/20) with stars `bi bi-star-fill`/`bi-star-half` (12px, `#E62415`) + "(50 reviews)" 16px Montserrat 500.
Slider `.swiper.testimonial-slider` (main.js:331–353): 1 slide, speed 1500, **effect fade, crossFade**, autoplay 4000, loop; controls `.next-2/.prev-2` + fraction `.franctional-pagi1`. Card (5602–5655): eyebrow `span` primary 16px 500; quote `p` Marcellus 30px/1.3 (→24 ≤767); author row 70px round img + h6 18px 600 + span 14px 500. Pagination: Marcellus 24px current / 16px total (5685–5699) + `.dash` 1px hairline; floating white control plate bottom-right (5741–5756, hidden ≤767). Entrances: `.swiper-slide-active` items animate `fadeInUp/fadeInDown 1.7s` (5602–5604, animate.css classes).

## People cards `.people-card6` — CSS 12013–12110, HTML 902–1040

`.people-img` overflow hidden; overlay `.explore-btn` centered 50px circle btn `rgba(255,241,241,0.7)`, `1px solid #FFF`, arrow fill primary; hover: card → bg primary/border primary, icon white; button scales `scale(0)→1` and social rail slides `right:-70px→30px` (both .45s; inner .35s). Socials: 26px white circles, bx icons 12px, hover → primary bg. Content: `h5 a` Marcellus 20px/28px hover primary; role span Montserrat 500 14px. Grid: `col-lg-3 col-sm-6`, `g-lg-4 gy-5`.
`.find-job-card` (CSS 11621–11710, HTML 1016–1039): `#E8F1FB` strip, 42px primary corner triangle w/ rotated "Hire" 12px label, left icon+copy (h5 Marcellus 20px), right image with `clip-path polygon(30% 0%…)`, hidden ≤767.

## Working process `.step-card1` — CSS 9101–9160, HTML 1042–1099

Section bg `#EFEAE6`, `padding:100px 0 352px` (12115 — tall bottom for the overlapping event strip). Card max-w 320: step badge `span` (`background: var(--primary-color)`, white 14px 600, radius 14, `padding:6px 17px`; `.two` variant on this page uses translucent white `rgba(255,255,255,0.4)` + white border instead, 12119), `h3` Marcellus 28px, dot-bullet list (8px circle border `--paragraph-color`, left 18px padding, mb 10) or plain p.

## Event strip `.home6-event-section` — CSS 12123–12325, HTML 1096–1273

Bg `#F4F9FD`; `max-width:1740px; margin-left:auto; margin-top:-250px; padding:60px 80px 60px 395px` (→60/30/195 →60/20 @767 with clip-path flattened); `clip-path polygon(15% 0%,100% 0,100% 100%,0% 100%)`; decorative rotated `#EFEAE6` bar (hidden ≤1699). Vertical `.slider-btn-group` (prev-7/next-7) absolute left, hidden ≤991. Slide `.single-event`: left copy (eyebrow Marcellus 18px; `h2` Marcellus 40px→30 ≤1199; meta ul = 13px icons + Montserrat 14px 500 links, hover → title color) + `primary-btn1`; right `.event-author-area` 290px white hairline card `padding:70px 30px 30px`, primary corner `.batch` (12px 600 `padding:9px 17px`), 106px round avatar, Marcellus 20px name. Swiper `.event-slider` (main.js:422–439): fade+crossFade, loop, autoplay 2500, nav `.next-7/.prev-7`, no pagination.

## Blog cards `.blog-card2` — CSS 8137–8289, HTML 1276–1462

4-up `col-xl-3 col-lg-4 col-sm-6` (+ `.divider` hairline above on this page, 8286). Card: `ul.tags` — inline-flex `gap:30px` (20 ≤1399), separators `12px×2px rgba(13,23,32,0.1)` bars; tag links 12px Montserrat 500 w/ 12px primary icons, hover primary. `.blog-img.magnetic-item` (magic-cursor interactive) mb 23px. `h4 a` Marcellus 24px/1.4 hover primary; `.explore-btn` "Read More". Alternate layout strips: `.blog-wrap:nth-child(even) .blog-img img { max-height:290px; object-fit:cover }` (8128–8135).

## Client logos `.client-section` — HTML 1444–1460

`.marquee_text2` jQuery-marquee, config inline: `direction:"left", duration:25000, gap:50, duplicated:true, startVisible:true` (index.html:1738–1746). 6 PNG logos in `a` tags.

## Contact `.contect-section6` — CSS 12329–12343, HTML 1464–1534

Bg `contact-bg.png` cover `padding:100px 0`. Left `col-lg-5`: `.section-title1 h2` (max-w 570) + p. Right `col-lg-7` `.contact-form-area.two` (light variant, CSS 10276–10301): white bg, inputs `background:#FFF; border:1px solid #eee; border-radius:0`, text `--paragraph-color` 14px Montserrat 400, placeholder `rgba(86,96,100,0.5)`; dark variant `.contact-form-area` (base 10180–10274): bg `--title-color`, inputs `#14202B` square 50px h, caret #AAA, labels `#C2C2C2` 14px 600, focus border primary. Textarea min-h 118px. Check: `.form-check-input` 14px square (square, not round), checked = primary. Submit = `primary-btn1 btn-hover` "Submit Now". Grid: `col-lg-6 mb-30` field pairs, textarea `col-lg-12 mb-15`, check `mb-50`.

## Footer — CSS 6213–6541, HTML 1536–1707

`footer { background:#0A141D; padding-top:100px }`. Widgets row (`pl--95 pr--95 mb-100`): subscribe (`h2` Marcellus 40→30; `.form-inner` `border:1px solid rgba(255,255,255,0.1); background:#0D1720; height:60px; padding:10px 25px`; input transparent `#CACACA` 14px 500; round 36px primary submit; custom square checkbox 14px, CSS 6271–6296), hotline items (26–28px icons `#CACACA` + 1px×35px divider bar, label Marcellus 14px, value Montserrat 16px 600 white), 3 link columns (`.widget-title h3` Marcellus 30px; links `#CACACA` 15px Montserrat 500 mb 22px, hover white).
`.footer-menu-wrap`: `border:1px solid rgba(255,255,255,0.1)` flex — logo tile 294×81 `rgba(217,217,217,0.08)`, menu links white 15px 500 w/ 10px arrow SVG (opacity 0→1 on hover, link → #CACACA).
`.footer-btm`: copyright `#CACACA` 14px (links white, hover primary 500), social `.social-area` 26px circles `1px solid rgba(255,255,255,0.2)`, bx icons, hover → primary fill.

## Global widgets

- **Back-to-top** `.circle-container` (CSS 528–581, main.js:1090–1129): fixed right 30/bottom 55, 40px, inset ring `rgb(46,68,141)`, SVG path stroke `--paragraph-color` with `stroke-dashoffset` scroll progress (10ms linear), `bi` glyph `\f145` overlay, shows `.active` after 50px scroll, smooth scroll-to-top.
- **Magic cursor** `#magic-cursor > #ball` (CSS 584–709, main.js:705–1052): GSAP-driven, 36px 2px-border ball trailing at ratio .15; `.magnetic-item` wrapper enlarged to 70px on hover (`duration:.3`); menu links morph to 100px 0.2-opacity disc; `[data-cursor]` → label view; hides over standard links/buttons. Desktop >1024 only (guard main.js:712).
- **Preloader** `.preloader`: `delay(1600).fadeOut("slow")` on load (main.js:87–90).
- **Search & language dropdowns**: shared pattern — `display:none; transform:scaleY(0); transform-origin:top` → `.active { display:block; transform:scaleY(1); animation: fade-up(2) .5s linear }` (search 1655–1667, language 1777–1787); outside-click closes (main.js:77–82).
