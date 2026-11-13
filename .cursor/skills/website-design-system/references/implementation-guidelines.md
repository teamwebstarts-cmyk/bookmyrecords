# Implementation Guidelines

How to extend the site at the repo root without breaking its design language. Everything here is derived from the actual codebase layout.

## Project structure (the only file that matters)

```
├── index.html                  ← Home 06
├── about.html, contact.html, faq.html, pricing.html
├── services1.html, service-details.html, terms-conditions.html
├── assets/
│   ├── css/
│   │   ├── style.css           ← ALL custom styles (15,971 lines, numbered sections 01–68)
│   │   ├── bootstrap.min.css │ bootstrap-icons.css │ swiper-bundle.min.css
│   │   ├── slick.css │ slick-theme.css │ animate.min.css │ jquery.fancybox.min.css
│   │   ├── boxicons.min.css │ aos.css
│   │   └── fonts/              (icon font files)
│   ├── js/
│   │   ├── jquery-3.6.0.min.js │ popper.min.js │ bootstrap.min.js
│   │   ├── swiper-bundle.min.js │ slick.min.js │ waypoints.min.js
│   │   ├── aos.js │ jquery.counterup.min.js │ isotope.pkgd.min.js │ jquery.fancybox.min.js
│   │   ├── gsap.min.js │ ScrollTrigger.min.js │ simpleParallax.min.js
│   │   ├── SmoothScroll.js │ TweenMax.min.js │ jquery.marquee.min.js
│   │   └── main.js             ← ALL custom behavior (1,131 lines, jQuery plugin style)
│   ├── fonts/  (boxicons) └── img/ (home1…home6, inner-pages) └── video/
└── _reference/                 (local reference HTML; gitignored)
```

There is **no package.json, no build step, no scss, no modules**. Page order of scripts is fixed (index.html:1706–1747): jQuery → popper → bootstrap → swiper → slick → waypoints → aos → counterup → isotope → fancybox → gsap → ScrollTrigger → simpleParallax → SmoothScroll → TweenMax → marquee → main.js → inline page script.

## CSS conventions (extracted)

1. **Numbered section headers**, e.g. (style.css:1416):
   ```css
   /*=====================================
    03. Header css 
   ========================================*/
   ```
   New work gets a new number/heading at the **end** of the file (current last section: 68).
2. **Selector style:** full descendant paths from a component root — `.header-area.style-1 .menu-wrap .main-menu ul > li ul.sub-menu > li > a` — never bare element selectors (except the reset/typography block at lines 89–160).
3. **Style variants via modifier classes:** `.style-1/.style-2/.two/.three/.white/.last` on section roots and cards (e.g., `.contact-form-area.two`, `.testimonial-wrap.two`, `.step-card1.two` via parent `.two`).
4. **State classes:** `.active` (menus, hotspots, tabs, search), `.show-menu` (mobile drawer), `.sticky` (header), `.slide` (sidebar), `.magnetic-active` (cursor) — CSS always targets the class, JS only toggles classes.
5. **Vendor-prefix pairs** present in source (`-webkit-` + std for transform/clip-path/text-fill). Mirror this when adding anything non-trivial.
6. **Weird-but-intentional quirks to preserve when copying:** `.mt-100/.mb-100` are actually 110px (319–330); `transition: 0.35` without unit (2550); duplicate keyframe declarations. Don't "fix" them in shared utilities.

## JS conventions (extracted from main.js)

- Wrap everything in the existing IIFE: file starts `(function ($) { "use strict";` and ends `}(jQuery));` — new handlers go **before** the closing line, in `// ==== Title ====` comment blocks.
- Interaction idiom is **jQuery class toggling**:
  - Accordion: `.dropdown-icon` click → `toggleClass('active') + next('ul').slideToggle()` + close siblings (98–101).
  - Hover-swap: list `li` mouseenter → add `.active` to self, remove from siblings, and mirror index onto a paired panel (`.services-list/.services-img` pattern, 37–51).
  - Outside-click dismiss: `$(document).on("click", …closest(".search-input, .search-btn…")` (77–82).
- New Swiper init: `var swiper = new Swiper(".your-slider", { … })` following the breakpoint ladder (192–708).
- New counter: any `h2.counter` is automatically picked up by the global CounterUp call (113–116).
- Keep the magic-cursor guards intact: behaviors inside `if ($(window).width() > 1024)` (712) apply desktop-only; add `.magnetic-item`/`hide-cursor`/`not-hide-cursor` classes rather than new cursor JS when possible.

## HTML conventions (extracted)

- Section wrapper pattern (see layout-and-spacing.md §6); HTML comments `<!-- Start/End X Section -->`.
- Every visually-interactive control is an `<a>` (buttons too: submit uses `<button class="primary-btn1 btn-hover">` only inside forms).
- Icons: inline `<svg>` with hand-written path data + width/height/viewBox attributes, or `<i class="bi/bx …">`.
- Reuse verbatim markup chunks from existing sections (header, title block, cards) and change only content — this is how the template keeps pages consistent.

## Dependency rules

- **Do not** add npm packages, CDNs, icon packs, or chart/slider libs. Everything needed ships in `assets/` (README.md documents full resource closure: 63 HTML refs + 29 CSS url() refs, all present).
- If a new interaction truly can't be done with Swiper/GSAP/jQuery already loaded, prefer plain CSS; second choice: small vanilla JS in the inline `<script>` block at the end of index.html (marquee config lives there as precedent).
- **Do not** wire AOS, ScrollTrigger, isotope, simpleParallax or TweenMax into new work — they're loaded but intentionally unused on this page; using them would produce motion inconsistent with the design system (see animations-and-motion.md).

## Influence / reference pages

The other template pages referenced by the menu (services1.html, about.html, blog-grid.html, …) are **not present** in the repo — the clone scope was deliberately this one page (README.md: "megamenu links point to template pages that are NOT part of this single-page scope"). When asked to build such pages, derive layouts from the CSS sections (55–68 cover Blog/About/Event/FAQ/People/Career/Pricing/Contact/Details pages) and the component catalog — the CSS for them already exists.

## BMR brand overlay (Book My Records)

Task spec: `tasks/change-ds.md`. Skill reference: `references/bmr-brand-system.md`.

1. Link theme file **after** `style.css`: `assets/css/bmr-ds.css` on every HTML page.
2. Remap `:root` `--primary-color`, `--title-color`, `--paragraph-color` to BMR tokens; only override hard-coded hex where the template does not use variables.
3. Do **not** edit numbered sections in `style.css` until promoting the overlay.
4. Do **not** add layout-only overrides (extra card padding, new shadows) unless explicitly in the brand spec.

Branch: `feature/bmr-design-system` (preview home first, then other pages).

## Validation checklist before finishing any change

1. `python -m http.server 8765` from the repo root; load `http://localhost:8765/index.html`.
2. Console: **0 errors, 0 failed requests** (README.md QA bar; verified originally at 4 viewport sizes: 1440×900, 1280×800, 768×1024, 390×844).
3. Visual: spot-check at 1440×900 and 390×844; landmark section geometry should match the verified clone (see README.md).
4. Behavior: 3 Swiper sliders advance; mobile burger opens 280px drawer + accordion; submenu hover-dropdown on desktop; marquee runs; counters tick; back-to-top ring fills; video plays.
5. New CSS appended with a numbered header; no existing lines edited.
