# Project Guide

A static business-consulting website. This guide helps agents and contributors find the right files, understand how the page is assembled, and run it locally.

## Quick start

Serve the repository root so relative asset paths resolve correctly:

```powershell
python -m http.server 8765
```

Open <http://localhost:8765/>. No package manager, build step, or compilation is required.

## Repository map

```text
.
├── index.html                         # Single-page site entry point and section markup
├── assets/
│   ├── css/
│   │   ├── style.css                  # Main site styles and responsive rules
│   │   ├── bootstrap.min.css           # Layout grid and framework styles
│   │   ├── swiper-bundle.min.css       # Carousel styles
│   │   ├── slick.css                   # Slick slider styles
│   │   └── fonts/                      # Bootstrap Icons and Slick fonts
│   ├── js/
│   │   ├── main.js                    # Site interactions and slider configuration
│   │   └── ...                         # jQuery and vendor libraries
│   ├── fonts/                          # Boxicons font files
│   ├── img/                            # Logos, section imagery, and illustrations
│   └── video/                          # Background video assets
├── .agents/skills/website-design-system/
│   ├── SKILL.md                        # Design-system entry point and implementation rules
│   └── references/                     # Detailed design and implementation references
├── _reference/                         # Local-only reference material; excluded from Git
└── README.md                           # This guide
```

## Where to make changes

- **Page content and structure:** `index.html`. Sections are marked with start/end HTML comments. Asset URLs are relative to the repository root.
- **Visual styling:** `assets/css/style.css`. It contains the custom component styles and responsive behavior; vendor stylesheets are separate. Follow the existing variables, class names, and section organization. Append new custom styles rather than modifying vendor files.
- **Interactions:** `assets/js/main.js`. This initializes the page's menus, sliders, counters, cursor effects, and other behaviors. Vendor libraries are in the same directory; avoid editing them.
- **Images, fonts, and video:** use the appropriate subdirectory under `assets/`. Keep filenames and letter casing aligned with references in HTML/CSS; paths are case-sensitive on Linux hosts.
- **Design conventions:** start with `.agents/skills/website-design-system/SKILL.md`. Read the relevant file in `references/` for tokens, typography, layout, components, motion, responsive behavior, assets, or implementation guidelines.

## Working safely

1. Preserve the existing static architecture; there is no build system or dependency manifest.
2. Keep paths relative to the repository root and verify referenced assets exist.
3. Check the page at desktop and mobile widths after changing layout or behavior. Useful widths include 1440px, 991px, 767px, and 576px.
4. Check the browser console and network panel for errors or missing assets.
5. Keep `_reference/` local. It is intentionally listed in `.gitignore` and should not be committed.

## Notes

The site is a single page. Some navigation links point to pages not included in this repository. The `.cursor/skills/website-design-system/` directory contains the project-specific rules and source-derived references for maintaining a consistent UI.
