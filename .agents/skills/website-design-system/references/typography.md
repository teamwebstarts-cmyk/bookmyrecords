# Typography

Font import (style.css:81): `@import url("https://fonts.googleapis.com/css2?family=Marcellus&family=Montserrat:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap");`

## Families (extracted)

| Family | Role | Weight |
|---|---|---|
| **Marcellus** (serif) | ALL display/section/hero headings, card titles, testimonial quotes, footer widgets, fraction pagination numerals | always `400` (occasionally `500` on white-overlay titles e.g. eg-card3 8489) |
| **Montserrat** | body, UI, labels, buttons, nav, chips, meta, counters | 300–900; workhorses are **400** (body), **500** (UI/meta), **600** (emphasis/labels) |
| Bootstrap-icons / Boxicons / Font Awesome 5 Free | icon glyphs only (552, 569, 659) | n/a |

Base rules (style.css:108–149): `body { font-size:16px; font-family: var(--font-montserrat); }`; generic `h1–h6 { font-family: var(--font-montserrat); font-weight:700; margin-bottom:15px; }` — but every real heading class overrides to Marcellus 400. `p { margin:0; color: var(--paragraph-color); }`. Lists: `list-style:none`.

## The standard heading recipes (extracted)

### Hero / page title (style.css:11719–11769)
```css
.banner-area6 .banner-left-content h1 {
  color: var(--title-color); font-family: var(--font-marcellus);
  font-size: 75px; font-weight: 400; margin-bottom: 40px;
}
/* highlight span inside h1 */ .banner-area6 ... h1 span { color: var(--primary-color); }
/* responsive: 1199→60px, 991→55px, 767→48px, 576→40px */
```

### Section title (`.section-title1`)
- Pill label: `span` → Montserrat 400, 16px, `line-height:1`, `border:1px solid var(--title-color)`, `border-radius:16px`, `padding:7px 20px` (style.css:768–777). Variants: pill-white (`.home6-about-section .sub-title span` 11922), cream-gradient text variant (6727).
- Heading: `h2` → Marcellus 400, `40px` desktop → `30px` ≤1199, `margin-top:-10px`, `max-width:740px` (779–795).
- Layout: flex row, `justify-content: space-between`, `gap:25px`; `.two` variant stacks vertical (801–809).
- Big variant `.section-title2 h2`: Marcellus 75px → 55px → 40px (818–826).

### Card titles
| Component | Spec |
|---|---|
| `h4 a` in eg-card4 / blog-card2 / video | Marcellus 400, **24px**, line-height 1.4, hover → primary (8800, 8206, 7718) |
| `h3` step-card1 | Marcellus 400 28px, mb 20px (9119) |
| `h2` event card | Marcellus 400 40px, mb 15px (12229) |
| `h3` footer widget-title | Marcellus 400 30px (6365) |
| `h2` subscribe | Marcellus 400 40px → 30px ≤1499 (6218) |
| author `h6` | Montserrat 600 18px, mb 7px (11375, 5648) |
| role/meta `span` | Montserrat 500 14px (11381) |

### Body & paragraph
- Standard paragraph: Montserrat 400, **16px / line-height 30px**, `var(--paragraph-color)` (7399, 12528).
- Small/meta: 14px Montserrat 500 (e.g., footer links 6378, tags 8185).
- Chip/tag text: 12px Montserrat 500 (8181, 8772).
- Testimonial quote: **Marcellus 400 30px / 1.3** (5619; 24px ≤767; home5 card 30px Marcellus 11365).
- Marquee links: Montserrat 500 25px (7518).
- Ghost numeral: Montserrat 700 **135px** `#DFEBF7` (11266).
- Breadcrumb company watermark: Marcellus 400 **200px** `rgba(255,255,255,0.2)` (12372).

### Links
- Default: no underline. Hover → primary (light ctx) / `#CACACA` (dark ctx), `transition: 0.35s`.
- Underlined variant: `.find-job-card … a { text-decoration-line: underline; color: primary; }` (11691); about-section `h2 a` white underlined (11928).

### Responsive typography behavior (extracted)
Tier is consistent: 75 → 60 (≤1199) → 55 (≤991) → 48 (≤767) → 40 (≤576) for heroes (11740–11769, 6585–6610); 40 → 30 (≤1199) for section H2s (787–794); 24 → 22 (≤1399/≤576) for card titles (8810, 8208). Blog details H2 40→30 (12518).

### Type dos & don'ts
1. Headings are always **Marcellus 400** — even when the template CSS says 700 in the base `h*` rule, component rules win.
2. Never letter-space; no `text-transform:uppercase` anywhere in the design (only `capitalize` on nav 1848, 1943).
3. Don't introduce a third family; icon glyphs must use the two icon fonts.
4. Line heights: `1` for UI/pills, `1.3–1.4` for quotes/titles, `30px` for body paragraphs.
