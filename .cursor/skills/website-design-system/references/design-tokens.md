# Design Tokens

All values extracted from `assets/css/style.css`. Line numbers refer to that file unless noted.

**Book My Records brand overrides** are documented in `bmr-brand-system.md` and applied via `:root` remaps in `assets/css/bmr-ds.css` site-wide (not by replacing this file).

## 1. CSS variables (extracted, style.css:82–89)

```css
:root {
  --font-montserrat: "Montserrat", sans-serif;
  --font-marcellus:  "Marcellus", serif;
  --title-color:     #0D1720;   /* headings, dark surfaces, dark text */
  --white-color:     #fff;
  --paragraph-color: #566064;   /* body text */
  --primary-color:   #2E448D;   /* royal blue — the only accent */
}
```

These 6 tokens are the entire theming system. There are no other variables (no radius/spacing/shadow variables exist).

## 2. Color palette (extracted, frequency-counted across style.css)

### Core
| Role | Value | Where |
|---|---|---|
| Primary / accent | `#2E448D` | buttons, chips, active states, dot waves, footer subscribe button |
| Heading / dark surface | `#0D1720` | `--title-color`; navy sections (`.home6-about-section`, footer input bg, `#0D1720` literal used ~19×, body-heavy marquee band `.event-and-confarance-section`) |
| Body / paragraph | `#566064` | `--paragraph-color` |
| White | `#FFF` | on dark sections, cards |
| Hairline border | `#EEE` / `#eee` (77×) + `rgba(13,23,32,0.0784313725)` (~8×) | card borders, dividers, header borders, `.divider` (8286) |

### Light surfaces (tinted panels)
| Value | Use |
|---|---|
| `#F4F9FD` | pale blue section bg (`.company-activities-area` 11221, `.home6-event-section` 12128, `.testimonial-wrap.two` 5743, Swiper progressbar track 11907) |
| `#E8F1FB` | find-job CTA card bg (11622) |
| `#DFEBF7` | blog tags strip bg (5847), blog flip-card back (10460), ghost year numeral (11269) |
| `#DAE6F2` | `team-card.two` bg (4552) |
| `#F3F4F5` | small pill/gray chips (9877, 9886) |
| `#EFEAE6` | beige — work-process bg (12115), `team-card` bg (4508), `testimonial-wrap` bg (5584), event-section diagonal bar (12166) |
| `#FDF8F4` | cream; text gradient `linear-gradient(180deg,#FDF8F4 0%,#FFF 100%)` with `background-clip:text` (6727) |
| `#FAF8FB` | blockquote bg (12538) |

### Dark surfaces
| Value | Use |
|---|---|
| `#0A141D` | `footer` bg (6217), `services-tab-section.two` (9691) |
| `#14202B` | form inputs on dark (10205), `.services-wrap.two` tab (9686) |
| `#272727` | round icon button on dark (11179), submenu border on dark (2681) |
| `#08090B` | sticky style-1 header bg (1451) |
| `#232F3A`, `#191919`, `#160803` | one-off darks elsewhere in template |

### Muted / hover-on-dark
| Value | Use |
|---|---|
| `#CACACA` | 35× — link & title hover on dark/image contexts, footer links, calendar text; also `linear-gradient(90deg,#fff,#2E448D,#fff)` submenu underline (1959) |
| `#B0BABE` | secondary text on dark (11163, 11382) |
| `#C2C2C2` | dark-form input text/labels (10204, 10211) |
| `#494848` | dark-input placeholder (10228) |
| `#596977` | marquee band secondary (7483) |
| `#525252` | mobile submenu gradient (1968) |
| `#D9D9D9` | magic-cursor ball border (606), footer logo tile `rgba(217,217,217,0.08)` (6400) |
| `#AAA` | caret color in dark inputs (10216) |

### Semantic/one-offs (use sparingly — not part of the main vocabulary)
- `#E62415` review stars (5734)
- `#FF6B4A` 2× template-internal (not on this page)
- Banner overlays: `linear-gradient(0deg, rgba(13,23,32,0.6) 0%, rgba(13,23,32,0.15) 57.57%)` (7541), `linear-gradient(73deg, rgba(13,23,32,0.8) 0%, rgba(13,23,32,0.1) 60.4%)` (8882), `rgba(0,0,0,0.25)` video scrims (7683), `rgba(255,255,255,0.85)` banner6 wash over texture (11719).

## 3. Border radius scale (extracted)

| Radius | Elements |
|---|---|
| `0` | inputs/textareas (10215, 10286 — explicitly `border-radius:0px`), selects (11297) |
| `2px` | checkbox square (6279) |
| `5px` | small chips/tags on map card (9867, 9880, 12899 nav arrows) |
| `14px` | step badge (9107) |
| `15px` | nav link pill (1849, 2639), category chip (8778), category pill on overlays (7569) |
| `16px` | `.sub-title span` pill (745), banner `.btn-group` chips (11800/11831), `.eg-card3` chip (8469), breadcrumb border-radius 16 |
| `12.5px` | mini status pills (9903) |
| `36px` | round header CTA (1539 `border-radius:36px`), ripple circle (1561) |
| `50px` | round explore overlay button (12029) |
| `50%` | avatars, social icons, slider buttons, ripple span, magic ball |

Rule of thumb: **chips 14–16px, CTAs pill/round, inputs 0, cards 0.**

## 4. Borders

- Default hairline: `1px solid #EEE` on cards (5822 `.blog-card .blog-content`, 6388 `.footer-menu-wrap`, 12277 event author card, 11621-adjacent `.eg-card4.two` at 8821 `rgba(13,23,32,0.05)`).
- Dark hairline: `1px solid rgba(13,23,32,0.0784313725)` (header frame 1469, submenu border 1894).
- On dark: `1px solid rgba(255,255,255,0.1)` (footer form 6230, footer menu wrap 6388), `rgba(255,255,255,0.2)` (video card border 7698, breadcrumb 12428, social icons 6526).
- Section dividers: `.divider { border-top:1px solid #eee; margin-bottom:30px }` (8286); `.comment-title .dash::after` (12759) draws 1px `rgba(238,238,238,0.93)` line.
- Decorative 1px vertical rules: `.eg-card3::after` gradient fade (8449), footer hotline `rgba(255,255,255,0.1)` (6330), topbar separators `12px×1px #0D1720` (1096).

## 5. Shadows (extracted — the signature dropdown shadow)

| Shadow | Use |
|---|---|
| `0px 30px 80px rgba(8, 0, 42, 0.08)` | every dropdown/popover (search 1659, lang 1779, submenu 2011, location card style-4) |
| `0 1px 12px 2px rgba(0, 0, 0, 0.1)` | search close ×-button (1668) |
| `inset 0 0 0 2px rgb(46,68,141)` | back-to-top circle ring (539) |
| No box-shadow on cards | cards are flat, separated by hairlines — never add depth to cards |

## 6. Surfaces & decorative shapes

- **Flat hairline cards** on light bg; **bleed-to-edge image cards** with gradient overlays for case studies/projects (8870–8955, 7537–7600).
- **clip-path diagonals** are a signature: `polygon(15% 0%, 100% 0, 100% 100%, 0% 100%)` (event section 12134), `polygon(30% 0%, 100% 0, ...)` (find-job img 11700, slider-btn-area 11697), `polygon(8% 0%, 100% 0%, 100% 100%, 0% 100%)` (11402), corner triangle `polygon(0 100%, 100% 0, 0 0)` + rotated "Hire" label (11631–11647).
- **Rotated decorative bars**: 509×10px `#EFEAE6` at `rotate(33.2deg)` (12164).
- **Ghost numerals**: 135px Montserrat 700 `#DFEBF7` absolute bottom-left (11266–11275).
- **Blob/CTA button**: 178px "banner-btn" with scalloped SVG bg + centered content (11845–11881).
- Backdrop-filter: none used.

## 7. Interactive states (extracted)

- **Hover (light context):** text/icon → `var(--primary-color)`; on dark/image: → `#CACACA`. Standard transition `0.35s` (sometimes `0.4s`, `0.45s` for reveals).
- **Buttons:** ripple circle expands from click point (`width:225%; height:1000.5px` at 0.6s), text flips to inverse color (869–881). `:active` flips bg to white (881–883) or primary for `.primary-btn2` (923).
- **Slider buttons:** white 40px circle w/ `1px solid rgba(217,217,217,0.9)`; hover → primary bg, white fill (1004–1022); disabled `opacity:0.2` (1023).
- **Focus:** inputs `outline:0 solid; box-shadow:unset` globally (94–101); dark inputs get `border-color: var(--primary-color)` on focus (10231); checkboxes styled via Bootstrap, checked = primary (10254).
- **Active/selected:** nav items get `border-color: var(--title-color)` (2043); active list items (country dots) scale/expand cards.
- **Disabled:** Swiper nav opacity 0.2. No other disabled patterns exist.
- **Preloader:** `.preloader` fadeOut slow after 1600ms delay (main.js:87–90).

## Verification notes
- Values above were grepped/counted directly from `style.css`; variable declarations at lines 82–89 are the source of truth for the 6 tokens.
- Inferred (not explicit in code): the "hairline-flat-card" and "chip 15/16px" conventions are patterns across many components, not declared rules.
