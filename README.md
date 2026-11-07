# Project Guide

Static multi-page Aploxn template site at the repository root. Shared `assets/` backs every HTML file. This guide is for agents and contributors navigating the tree, running pages locally, and checking assets.

## Quick start

```powershell
python -m http.server 8765
```

Open pages from the repo root, for example:

| URL | File | Role |
|-----|------|------|
| `/` or `/index.html` | `index.html` | Home 06 (main entry) |
| `/about.html` | `about.html` | About |
| `/contact.html` | `contact.html` | Contact |
| `/faq.html` | `faq.html` | FAQ (accordion) |
| `/pricing.html` | `pricing.html` | Pricing |
| `/services1.html` | `services1.html` | Service grid (style 01) |
| `/service-details.html` | `service-details.html` | Service details |
| `/terms-conditions.html` | `terms-conditions.html` | Terms & conditions |

No build step or package manager is required.

## Repository map

```text
.
├── index.html                       # Home 06
├── about.html, contact.html, faq.html, pricing.html
├── services1.html, service-details.html, terms-conditions.html
├── assets/                          # Shared CSS, JS, fonts, images, video (130 files)
│   ├── css/style.css                # Custom styles (all pages)
│   ├── js/main.js                   # Shared interactions
│   ├── js/chart.min.js              # Loaded on inner pages (demo parity)
│   ├── js/chart-custom.js           # About consulting chart
│   └── img/…  video/…               # Page-specific art merged from clones
├── scripts/
│   └── audit-assets.py              # Check all *.html for missing assets/
├── _reference/                      # Original demo HTML snapshots (gitignored)
├── .cursor/skills/website-design-system/   # Design tokens & UI rules
├── website-content/                 # Copy and sitemap for the real BMR site
├── tasks/                           # Agent task specs (e.g. clone.md)
└── README.md
```

## Shared stack

Every page uses the same vendor + custom bundle:

- **CSS:** Bootstrap, Swiper, Slick, Boxicons, Bootstrap Icons, `animate.min.css`, `style.css` (home also loads `aos.css`).
- **JS:** jQuery 3.6, Popper, Bootstrap, Swiper, Slick, Waypoints, CounterUp, Isotope, Fancybox, GSAP (+ ScrollTrigger), parallax/smooth-scroll helpers, marquee, `main.js`.
- **Paths:** Always `assets/...` relative to the repo root.

`style.css` and `main.js` are identical across all shipped pages (SHA-256 verified during merge). Clone folders duplicated the same files; only **35** extra images/scripts/videos were merged into root `assets/`.

## Page-specific assets (merged into `assets/`)

| Area | Notable files |
|------|----------------|
| **Home** (`index.html`) | `video/video-bg3.mp4`, `home6/*`, hero/blog/client assets |
| **About** | `inner-pages/braadcrumb-bg2.jpg`, `about-mission-section-img.jpg`, `home2/about-img.jpg`, testimonial/people images, `video/video-bg2.mp4`, `js/chart-custom.js` |
| **FAQ / Contact / Pricing / Terms** | `white-logo.svg`, `inner-pages/braadcrumb-bg5.jpg`; FAQ adds `faq-img.jpg` |
| **Services1** | `braadcrumb-bg1.jpg`, `home2/services-01.jpg`–`06.jpg`, `shape-01.png`, `cover-left-vec.png` |
| **Service details** | `braadcrumb-bg6.jpg`, `service-details-solution-img.jpg`, `service-details-advantage-img.jpg` |

Breadcrumb JPEGs use the template spelling `braadcrumb` in filenames.

## Local patches (all pages)

- Cloudflare obfuscated emails replaced with plain `mailto:` addresses (`infoaploxn@gmail.com`, `info@gmail.com`, and contact-only variants where used).
- Cloudflare `email-decode.min.js` removed from HTML.

## Verification

```powershell
python scripts/audit-assets.py
```

Audits every `*.html` at the repo root (`src`, `href`, and inline `url(assets/...)`). Exit code `0` means no missing files. After the flatten merge, all listed pages reported **0 missing** refs.

**Behavioral smoke checks (manual or browser):**

- Home: Swiper sliders, marquee, counters, magic cursor (desktop), `video-bg3.mp4`.
- About: testimonial swiper, CounterUp, Chart.js via `chart-custom.js`, `video-bg2.mp4`.
- FAQ: seven Bootstrap accordions.
- Contact: map iframe (external), form markup (no local submit backend).
- Service details: solution/advantage imagery, testimonial swiper.
- Services1: six service cards and people row.

## Where to edit

| Goal | Location |
|------|----------|
| Page markup | Matching `*.html` at repo root |
| Global styles | `assets/css/style.css` (append; don’t edit vendor CSS) |
| Shared behavior | `assets/js/main.js` |
| New images/video | Under `assets/img/` or `assets/video/` |
| Brand/content for BMR | `website-content/` (not wired into HTML yet) |
| Visual conventions | `.cursor/skills/website-design-system/SKILL.md` |

## Scope & nav

Megamenu still links to other demo routes (`index2.html`, `blog-grid.html`, …) that are **not** in this repo. Shipped pages cross-link among the table above.

Forms and newsletter blocks keep demo markup; they need a backend to submit.

## `_reference/` and `scripts/`

- `_reference/` holds untouched demo HTML (`original_index6.html`, `about.html`, …). Listed in `.gitignore` — keep local, do not commit.
- `scripts/audit-assets.py` is optional QA only; the site does not depend on it at runtime.
