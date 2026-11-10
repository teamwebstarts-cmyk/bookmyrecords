---
name: website-design-system
description: Aploxn template + Book My Records (BMR) brand layer for this static site. Use when styling or building pages/components. Template tokens live in style.css; BMR rollout uses body.bmr-ds and overlay CSS (see references/bmr-brand-system.md).
---

# Aploxn Design System

Reverse-engineered design language of the cloned site (`index.html` — Home 06 variant of the "Aploxn – Business Consulting HTML Template" by Egens Lab). All values below are extracted from source, not invented.

## What this project is (read first)

- **Stack:** plain static HTML. No build step, no bundler, no package.json, no Tailwind, no SCSS.
- **Styling:** ONE hand-written global stylesheet `assets/css/style.css` (15,971 lines) + vendor CSS (Bootstrap, Swiper, Slick, Boxicons, Bootstrap Icons, AOS, Fancybox, animate.css).
- **Behavior:** jQuery 3.6 in `assets/js/main.js` plus vendor libs (Swiper, Slick, GSAP, CounterUp, Fancybox, marquee). Page-specific JS is a small inline `<script>` after `main.js` (see `index.html` lines 1737–1747 for the marquee init pattern).
- **Layout:** Bootstrap 5 grid (`bootstrap.min.css` + Popper) inside `.container-fluid.one` wrappers.
- Never add a CSS framework, preprocessor, or component library. Follow the existing vanilla CSS + CSS-variables approach. Never modify existing sections of `style.css` — append at the end in its numbered-comment style.

## Design tokens at a glance (details in `references/design-tokens.md`)

```css
/* assets/css/style.css lines 77–88 */
:root {
  --font-montserrat: "Montserrat", sans-serif;
  --font-marcellus:  "Marcellus", serif;
  --title-color:     #0D1720;
  --white-color:     #fff;
  --paragraph-color: #566064;
  --primary-color:   #2E448D;
}
```

Core palette (template): primary `#2E448D`, dark title `#0D1720`, body text `#566064`, light surfaces `#F4F9FD / #E8F1FB / #DFEBF7 / #DAE6F2`, dark surfaces `#0A141D / #14202B / #272727`, beige accents `#EFEAE6 / #FDF8F4`, muted-on-dark `#CACACA`, hairline border `#EEE` and `rgba(13,23,32,0.078)`. Signature dropdown shadow: `0px 30px 80px rgba(8, 0, 42, 0.08)`.

**BMR brand layer (Book My Records):** When the site should match client brand (`tasks/change-ds.md`), read `references/bmr-brand-system.md` first. Primary `#0B5ED7`, text `#1F2A44`, surfaces `#F2F6FB`, borders `#D9E2EC`, accent yellow `#FFC107` (sparse). Home preview: `assets/css/bmr-ds-home.css` remaps `:root` after `style.css` — do not rewrite template `style.css` blocks until approved.

Typography: **Marcellus (serif, weight 400) for headings/display**, **Montserrat (300–900) for everything else**. Body 16px / line-height 30px. Hero H1 75px → 40px across breakpoints. UI labels 14px/600, meta text 12–13px/500.

## When to invoke this skill

Use it whenever creating or editing anything visual in this repo (site files at repo root):

1. A new page or section (service card grid, testimonial, CTA banner, footer variant…).
2. A new component (button, chip/badge, card, slider, form).
3. Any hover/scroll/entrance animation.
4. Any responsive layout work.

## How to reference the reference files

- `references/design-tokens.md` — colors, radii, shadows, borders, CSS variables + line references. Start here for any styling.
- `references/bmr-brand-system.md` — BMR palette, component rules, rollout via `body.bmr-ds` overlay CSS.
- `references/typography.md` — font loading, scale, heading recipes.
- `references/layout-and-spacing.md` — containers, section skeleton, spacing utilities, clip-path patterns.
- `references/components.md` — reproducible specs for every existing component (headers, banners, cards, testimonial, people, steps, blog, map counters, forms, footer) with line references.
- `references/animations-and-motion.md` — keyframes, transition/duration/easing catalog, Swiper/GSAP/cursor/marquee configs.
- `references/responsive-design.md` — real breakpoints and the collapse rules for every component.
- `references/assets-and-icons.md` — icon fonts (Bootstrap Icons + Boxicons), inline-SVG arrow language, logos, fonts, video.
- `references/implementation-guidelines.md` — naming conventions, file organization, how to extend `main.js` / `style.css` safely, dependency rules.

Read the file matching your task plus `design-tokens.md`. Copy an existing component's markup/CSS as the base and restyle minimally instead of writing parallel conventions.

## Non-negotiable rules

1. **Colors:** use the CSS variables (`var(--primary-color)` etc.) or the exact extracted hexes. No new hues; the rare `#FF6B4A` orange exists but is not in the page's vocabulary.
2. **Fonts:** Marcellus for headings with `font-weight: 400`; Montserrat for UI/body. Do not introduce other families. Headings inside generic `h1–h6` default to Montserrat 700 (style.css:119–127), but section titles always override to Marcellus 400.
3. **Radii are a language:** chips/badges 14–16px, nav links 15px, CTAs 36px `border-radius` pill, avatars/circles 50%, inputs exactly `0`. Don't "soften" cards with large radii — cards are square with `#EEE` hairlines.
4. **Buttons need the ripple span** (`<span></span>` inside `.primary-btn1` / `.btn-hover`) and the diagonal-arrow SVG; hover = circle ripple expands (0.6s) + arrow swap color. `.explore-btn` hover rotates the arrow 45deg.
5. **Hover state color is `var(--primary-color)`** for dark-on-light text/icons, and `#CACACA` for white-on-dark/dark-on-image titles. Transitions 0.35s.
6. **Dropdown/popover reveal = `display:none → block` + `scaleY(1)` + `fade-up 0.45–0.5s linear`** keyframes (style.css:2052–2063). Don't fake it with opacity classes.
7. **Sliders are Swiper** (speed 1500–2000, autoplay 2500–4000ms, fade `crossFade: true` for testimonials) driven by custom 40px circular `.slider-btn` prev/next and fraction/progressbar pagination. Marquees use jQuery-marquee or the `gallery-slider` speed-5000 trick.
8. **Sections:** `<!-- Start/End X Section -->` comments wrap `<div class="<name>-section mb-130"> > .container-fluid.one > .row > bootstrap cols` (or `.container-fluid.one.pl--95` for inset sections).
9. **Section headers:** `.section-title1` (pill `<span>` + Marcellus `<h2>` flex row) — reuse, never redesign.
10. **Old CSS is frozen.** Append new rules at the end of `style.css` under a new numbered comment header; reuse existing classes before writing new ones.

## Quick recipes

New section header (light background):

```html
<div class="section-title1 two">
    <span>Our Cover Area</span>
    <h2>Your Marcellus display line here.</h2>
</div>
<a class="explore-btn" href="services1.html">
    Explore Area
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12">
        <path fill-rule="evenodd" clip-rule="evenodd"
            d="M10.1865 1.06237L0 11.2484L0.751627 12L10.9376 1.81347V8.85645H12V0H3.14355V1.06237H10.1865Z"></path>
    </svg>
</a>
```

Primary button (ripple + arrow, see style.css:837–884):

```html
<a href="contact.html" class="primary-btn1 btn-hover">
    Get in Touch
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12">
        <path fill-rule="evenodd" clip-rule="evenodd"
            d="M10.1865 1.06237L0 11.2484L0.751627 12L10.9376 1.81347V8.85645H12V0H3.14355V1.06237H10.1865Z"></path>
    </svg>
    <span></span>
</a>
```

Category chip (style.css:8772–8782):

```html
<a href="services1.html">Marketing</a>
/* .eg-card4 .card-content > a { font:12px Montserrat 500; border:1px solid #0D1720;
   border-radius:15px; line-height:1; padding:4px 12px; } */
```

New Swiper carousel (copy config from `main.js`; Swiper inits span 192–708):

```html
<div class="swiper cover-slider-with-progress">
  <div class="swiper-wrapper"> <div class="swiper-slide"> …card… </div> </div>
</div>
```

## Validating visual consistency

1. Serve locally (`python -m http.server 8765` from repo root); check layout at 1440×900 and 390×844.
2. Verify: colors come from tokens; headings render Marcellus 400; buttons ripple on hover; arrows rotate 45deg on `.explore-btn` hover; dropdowns use the `fade-up` animation; inputs are square with dark `#14202B` (or `#FFF` bordered) surfaces; footer/dark sections use `#0A141D`/`#0D1720` with `#CACACA` links.
3. Test 1200px, 991px, 767px, 576px breakpoints; the mobile menu must open as a 280px white drawer (`show-menu` class) and submenus must accordion via `.dropdown-icon` toggles.
4. Console must show 0 errors and 0 failed requests (this is the established QA bar — see `README.md`).
