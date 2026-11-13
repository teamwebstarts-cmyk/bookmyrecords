# Book My Records — Brand design system (BMR layer)

Visual language extracted from the **Book My Record Analysis** brand reference. This layer sits **on top of** the Aploxn/Egens template tokens documented in `design-tokens.md`. Do not delete template docs; override via scoped CSS when rolling out BMR.

## 1. Brand palette

### Primary
| Token | Hex | Usage |
|---|---|---|
| `--bmr-primary` | `#0B5ED7` | Primary buttons, links, focus rings, active nav, progress fills |
| `--bmr-primary-dark` | `#0846A8` | Button hover/pressed, dark emphasis on blue UI |
| `--bmr-accent-yellow` | `#FFC107` | Sparingly: stat highlights, badges, one CTA accent per view |
| `--bmr-accent-yellow-deep` | `#E0AA00` | Yellow hover / secondary emphasis |

### Supporting
| Token | Hex | Usage |
|---|---|---|
| `--bmr-white` | `#FFFFFF` | Page and card surfaces |
| `--bmr-surface` | `#F2F6FB` | Section bands, alternate rows |
| `--bmr-text` | `#1F2A44` | Headings, strong labels (maps to `--title-color` when active) |
| `--bmr-border` | `#D9E2EC` | Cards, header frame, inputs, dividers |
| `--bmr-success` | `#22C55E` | Success states, positive chips |
| `--bmr-warning` | `#F59E0B` | Warnings |
| `--bmr-error` | `#E53935` | Errors, destructive emphasis |

### Semantic mapping onto template variables

On the live site, `assets/css/bmr-ds.css` (loaded after `style.css` on every page) overrides `:root`:

```css
--primary-color: var(--bmr-primary);
--title-color: var(--bmr-text);
```

Keep Marcellus + Montserrat stacks unchanged unless product asks otherwise.

## 2. Visual language

- Corporate SaaS / professional services: white and light-neutral backgrounds, blue for interaction, yellow as **accent only** (never full-width yellow sections).
- Cards: `border-radius: 12px`, `border: 1px solid var(--bmr-border)`, `box-shadow: 0 8px 24px rgba(31, 42, 68, 0.06)`.
- Inputs: square corners may remain template-default (`0`) or `8px` on BMR forms; border `#D9E2EC`; focus `border-color` / `outline` using `--bmr-primary`.
- Generous whitespace; preserve existing spacing utilities (`mb-130`, `pl--95`, etc.).
- Transitions ~`0.35s` (match template).

## 3. Components (BMR rules)

| Area | Rule |
|---|---|
| Header | Hairline `var(--bmr-border)` on `.header-wrap`; nav hover/active use primary blue |
| Primary CTA | `background: var(--bmr-primary)`; hover `var(--bmr-primary-dark)`; keep ripple `<span>` pattern |
| Secondary / text links | `explore-btn` hover → primary; optional yellow underline on one hero metric only |
| Hero | `h1 span` in primary blue; stats chip borders use `--bmr-border` |
| Service cards (`eg-card4`) | Card content panel: white surface, rounded, bordered, light shadow |
| Why cards (`eg-card-3`) | Rounded panel, light border; step number badge primary blue |
| Testimonials | Keep structure; progress bar fill → primary blue |
| FAQ accordion | Active/open border accent primary |
| Footer | May stay dark template footer until BMR pass; links hover `#CACACA` or primary on light footer variants |

## 4. Interaction & accessibility

- Focus visible on links and form controls: `outline: 2px solid var(--bmr-primary); outline-offset: 2px`.
- Hover: primary color on text/icons (template pattern).
- Disabled: reduce opacity; do not rely on color alone.
- Contrast: body text on white ≥ 4.5:1 (`#1F2A44` on `#FFFFFF`).

## 5. Responsive

- **Desktop:** Existing `container-fluid.one.pl--95.pr--95` insets unchanged.
- **Tablet:** Same grids; card shadows may reduce slightly.
- **Mobile:** Full-width CTAs in drawer; stacked cards; header drawer unchanged (280px).

## 6. Implementation (rollout)

1. Link theme CSS **after** `style.css`: `assets/css/bmr-ds.css` on every HTML page.
2. Remap `:root` (`--primary-color`, `--title-color`, `--paragraph-color`); only patch selectors where hex is hard-coded.
3. **Do not** bulk-edit `style.css` numbered sections until the overlay is approved.
4. Avoid layout-only overrides (extra padding, shadows, radii) unless the brand spec requires them.

## 7. Conflict resolution

| Template (Aploxn) | BMR choice |
|---|---|
| Primary `#2E448D` | `#0B5ED7` via `--primary-color` override |
| Title `#0D1720` | `#1F2A44` |
| Hairline `#EEE` | `#D9E2EC` on BMR-scoped components |
| Square cards | +12px radius on card surfaces in BMR scope |
| Navy dark bands | Keep until content redesign; optional lighter bands with `--bmr-surface` per section |
