# Aploxn — index6.html Clone (High-Fidelity Recovery)

Source: https://demo.egenslab.com/html/aploxn/preview/index6.html
Recovered: November 5, 2026

## What this is

A direct recovery of the original page. The cloned page reuses the ORIGINAL
HTML, CSS, JavaScript, images, fonts, icon fonts and video — downloaded from
the reference site — with only the minimal edits needed to run locally:

1. Cloudflare-obfuscated emails decoded and repaired
   (`infoaploxn@gmail.com` in header, `info@gmail.com` in the contact area
   and footer) — the `email-decode.min.js` Cloudflare script was removed.
2. No other functional or structural edits. Layout, interactions and assets
   are byte-for-byte the original template stack.

## Running

The page is a static site. Serve it with any HTTP server from this directory::

    python -m http.server 8765
    # then open http://localhost:8765/index.html

(Opening `index.html` directly from disk also mostly works, but a server is
recommended so video/fonts load exactly as deployed.)

## Contents

- `index.html` — the page (entry point)
- `assets/css/` — 10 stylesheets (bootstrap, bootstrap-icons, swiper, slick,
  animate, fancybox, boxicons, aos, main `style.css`) + `fonts/` (bootstrap
  icons, slick icon font, ajax-loader)
- `assets/js/` — 18 scripts (jQuery, popper, bootstrap, swiper, slick,
  waypoints, AOS, counterup, isotope, fancybox, GSAP, ScrollTrigger,
  simpleParallax, SmoothScroll, TweenMax, marquee, `main.js`)
- `assets/fonts/` — boxicons font family (eot/ttf/woff/woff2/svg)
- `assets/img/` — 51 images (home1/home2/home4/home5/home6 assets used by
  this page, incl. all CSS background images)
- `assets/video/video-bg3.mp4` — hero background video (19.7 MB)
- `_reference/original_index6.html` — untouched original HTML as downloaded (gitignored)

## Verification performed

- Rendered locally in Chromium at 1440×900, 1280×800, 768×1024, 390×844.
- 0 console errors, 0 failed network requests, 0 broken images.
- All 5 icon/web fonts load; all 3 Swiper sliders advance via their controls.
- Mobile menu opens (`show-menu`) and submenu accordion works.
- Hover dropdown menu works on desktop.
- Marquee runs (jQuery-marquee, 25 s loop), counters run (CounterUp),
  back-to-top circle button scrolls to top; background video plays.
- Section-by-section DOM geometry matches the original EXACTLY
  (9 measured landmarks identical to the pixel at 1440×900; total page
  height 9770 px on both; mobile height 16275 px on both).
## Known differences (expected, non-design)

- Pixel differences confined to JS-animated regions (banner service slider,
  testimonial slider, event slider, bottom marquee strip, parallax images,
  video frame). Two captures of the SAME page seconds apart differ in the
  same regions because these elements move continuously.
- Numerals rendered after CounterUp animation completes may show final
  values vs. mid-animation values depending on capture timing.
- The megamenu links point to template pages that are NOT part of this
  single-page scope (per task scope restriction). Clicking them 404s
  locally; the original navigates to sibling demo pages.

## Unavailable resources

None. Every resource the page requests (63 HTML references + 29 CSS url()
references) was recovered and verified present.
