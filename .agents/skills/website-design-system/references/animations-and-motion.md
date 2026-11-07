# Animations & Motion

Extraction of every motion system used on the page. Sources: `assets/css/style.css`, `assets/js/main.js`, `index.html` inline script.

## Motion tokens (inferred from frequency across CSS/JS)

| Token | Value | Evidence |
|---|---|---|
| Fast transition | **0.25–0.3s** | ball morphs (main.js uses `duration:0.3`), ripple detail, drag cursor .2 |
| UI transition | **0.35s** | the default for hovers on color/transform (`transition:0.35s` appears ~100×) |
| Reveal transition | **0.4–0.6s** | button ripple `all .6s` (839), card image reveals .45s, dropdown shadow cards .5s |
| Long slide | **1.5–2s** | Swiper `speed:1500` (nearly all), project slider `2000`, slick `2000`, header `.8s ease-out` |
| Typing/counter | 1000ms | CounterUp `time:1000, delay:10` (main.js:113–116); progress bar `1s linear` (4582) + JS rAF 1s (main.js:126–149) |
| Easing | `ease-out` (nav), `linear` (keyframe reveals), plain `ease` (mobile drawer `.3s ease-in` for transform), GSAP `Power2.easeOut` / `Expo.easeInOut` (anchor scroll 1.5s) |

## CSS keyframes (all extracted from style.css)

| Name | Lines | Behavior | Used by |
|---|---|---|---|
| `fade-up` | 2052–2062 | translate `translateY(10px)→0` + opacity 0→1 | desktop dropdown submenus `animation: fade-up .45s linear` (.style-1 2048, style-4 mirror), search panel `.5s linear` (1662) |
| `fade-up2` | 1297–1306 | same + `translateX(-50%)` (centered popovers) | lang-cards `.5s linear` (1286, 1781, 2565) |
| `fade-up5` | 9671–9680 | `translateY(10px) scaleX(0.4)→(0,1)` | services tab panes (transform-origin:left) |
| `fade-down` | 11202–11211 | `scaleY(0)→1` + fade | home5 services list expand `.45s linear` (11198) |
| `smooth-header` | 1459–1467 | `translateY(-30px)→0` | sticky header drop-in |
| `rotate` | 7428–7434 | rotate 0→360 | service icon `10s linear infinite` on hover (7427) |
| `fadeIn` | 8414–8420 | opacity 0→1 (1s) | banner image swaps |
| `waves` | 9806–9820 | circle `scale .2→.9`, opacity 0→.9→0 | map dot pulses — 3 layers, `3s ease-in-out infinite`, delays 0/1s/2s (9784–9805) |
| `qodef-animate-image-out/in` | 11109–11130 | clip-path inset wipe + `scale(1.05)→1`, `1s cubic-bezier(0.78,0.2,0.21,0.88)` | home5 services image swap on li hover |
| animate.css companion | vendor | `fadeInUp/fadeInDown 1.7s` | testimonial slide-active elements (5602–5604) |

Note: keyframes are re-declared per component block (e.g. fade-up at 2053 and 2847) — when appending, don't re-declare; reuse the existing names.

## CSS transitions catalog

- **Links/text:** `transition: 0.35s` on `color`, sometimes bundled `all .35s`. Arrows inside links also transition `.35s fill/transform`.
- **Buttons:** `transition: all 0.6s` (ripple mechanics), `:active` instant bg swap.
- **Slider buttons:** `0.4s`.
- **Card overlays:** `.project-content` 0.4s; caption `translateY(50px)→0` on hover (7568–7599); `.case-study-content` opacity 0→1 `.35s` (8888); `.eg-card3` copy `transform .5s ease, opacity .25s ease` (8505).
- **People card:** `.45s` wrapper, `.35s` inner (12015–12110).
- **Dropdown panels:** `transform-origin: top`, scaleY 0→1 + display flip + `fade-up` animation (1660–1665).
- **Mobile drawer:** `transform .3s ease-in` (2098).
- **Header frame:** `all .8s ease-out` (3426).
- **Progress bar:** width `1s linear` + rAF text ticker.
- **Marquee text links:** `.35s` hover to `#CACACA`.

## Transform conventions

- Reveals move **up**: `translateY(10px)` (dropdowns), `translateY(50–100px)` (captions start below).
- Scale reveals: location-card `translateX(-50%) scale(0)→scale(1)` (.5s), people explore `scale(0)→1` centered (`translate(-50%,-50%)` preserved).
- Rotations only: explore arrow +45deg; nav dropdown icon `\f2ea` swap; burger bars `rotateZ(±45deg) translate(8px,∓6px)` (.5s, 1400–1413).
- `will-change: transform` on slider-tracked elements (8461, 8505).
- clip-path wipes for image swaps (see keyframes table).

## Scroll-based behavior (extracted)

- **No AOS data-attributes are used on this page** (`aos.js`/`aos.css` are loaded globally but `AOS.init()` is commented out at main.js:110; no `data-aos` in index.html). Don't add AOS reveals to match this page.
- **Scroll-to-top ring**: `window.onscroll` updates SVG `stroke-dashoffset` (dasharray = path length) + toggles `.circle-container.active` past 50px (main.js:1090–1129).
- **Sticky header**: jQuery scroll threshold 200px toggles `.sticky` on `.position_top` (main.js:160–168); scroll listener for `.header-area` (`document.classList.toggle("sticky", scrollY>0)`) is commented out (104–109) — current page header is absolute, not sticky.
- **Anchor smooth scroll**: GSAP `Expo.easeInOut`, 1.5s, with header-height offset (main.js:955–989); fallback `jQuery.animate 800ms` (only inside the magic-cursor desktop branch).
- **Parallax**: `simpleParallax.min.js`, ScrollTrigger, TweenMax, SmoothScroll are loaded but not initialized in main.js for this page (no ScrollTrigger.gsap calls present). Treat as available-but-unused.
- **Marquee** (scroll-feel, not scroll-bound): jQuery-marquee config in index.html:1738–1746.
- **Infinite slider marquee alternative** used by the template: `.gallery-slider` Swiper with `speed:5000, autoplay delay:100` (main.js:673–700).

## Libraries — actual configs (all in main.js unless noted)

| Lib | Config used on this page |
|---|---|
| **Swiper** | `.cover-slider-with-progress` (521–565): speed 1500, spaceBetween 30, autoplay 2500, progressbar pagination `.progress-pagination2`, nav prev/next-4, breakpoints 280→1 … 1200+→3/4. `.testimonial-slider` (329–353): fade+crossFade, loop, autoplay 4000, fraction `.franctional-pagi1`, nav next/prev-2. `.event-slider` (418–438): fade, loop, autoplay 2500, nav next/prev-7. Breakpoint ladder used everywhere: 280/386/576/768/992/1200/1400. |
| **Slick** | `.casestudy-slider` (444–492): centerMode, variableWidth, autoplay 2000, speed 2000, breakpoints 1200/991/768/576/480/350. (Not on current page markup; loaded for template parity.) |
| **GSAP** | Magic cursor ball: ticker follow ratio `.15`, sizes 36→70 (magnetic) / 100 (menu disc) / 95 (`data-cursor`) / 60 (drag), `duration:.3` always; magnetic pull movement 25px `Power2.easeOut` (705–1052). |
| **CounterUp** | `{ delay:10, time:1000 }` on `.counter` (113–116); requires waypoints. |
| **Fancybox** | `[data-fancybox="gallery"]` / `gallery2`, buttons:["close"], protect:true (176–189). |
| **jQuery marquee** | inline config, duration 25000, gap 50 (index.html:1738). |
| **TweenMax / SmoothScroll / simpleParallax / isotope** | loaded, not initialized here. |

## Reproducing an interaction (workflow)

1. Identify trigger class in HTML (e.g., hover on `.people-card6`).
2. Find its CSS transition block (12015–12110) — copy durations/easings exactly.
3. If JS-driven, find the jQuery handler in main.js and mirror its class-added state (e.g., `.active`), which the CSS targets.
4. New Swiper: pick nearest config above; wire `nextEl/prevEl` to fresh `.next-N/.prev-N` classes and add breakout breakpoints.
5. New keyframed entrance: reuse `fade-up`/`fade-down` names; `transform-origin` + `visibility` toggles are part of the recipe.
