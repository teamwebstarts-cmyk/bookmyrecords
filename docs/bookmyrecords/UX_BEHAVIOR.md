# BookMyRecords — UX Design, Micro-Interactions & Responsive Behavior Specification
**Version**: 2.0 (Streamlined Document-Intake Architecture)  
**Target Milestone**: Milestone 4  
**Date**: November 2026  
**Audience**: UI/UX Designers, Frontend Engineers, QA Specialists

---

## 1. Visual Hierarchy & Design System Foundations

The BookMyRecords interface embodies modern financial rigor, transparency, and high executive trust. It is designed around the core color tokens defined in `assets/css/bmr-ds.css`:

- **Primary Brand Color**: `--bmr-primary` (`#0B5ED7`) — Used for primary CTA buttons, active wizard step indicator, dropzone hover borders, and report highlight badges.
- **Dark Brand Anchor**: `--bmr-primary-dark` (`#0846A8`) — Used for button hover states and focused interactive elements.
- **Deep Navy Text**: `--bmr-text` (`#1F2A44`) — Used for prominent headers, metric values, and card titles.
- **Neutral Surface Wash**: `--bmr-surface` (`#F2F6FB`) — Background wash for wizard header, card containers, and dropzone idle state.
- **Risk & Status Semantics**:
  - *Strong / Success*: `#198754` (Emerald Green)
  - *Moderate / Primary*: `#0B5ED7` (Sapphire Blue)
  - *Vulnerable / Warning*: `#FD7E14` (Warm Amber)
  - *Critical / Danger*: `#DC3545` (Ruby Red)

---

## 2. Interactive Component Behaviors & Micro-Interactions

### A. Homepage Teaser Section (`index.html`)
1. **Header & Value Proposition**:
   - Clean, centered container displaying trust badge pill (*Instant 24-Point AI Diagnostic Report*), headline, and descriptive subhead highlighting zero friction and 100% free access.
2. **Trust Badges Row**:
   - 4 responsive pill badges (*100% Free*, *No Login Required*, *Instant AI Analysis*, *Confidential & DPDP Compliant*).
   - On mobile screens, badges wrap smoothly into two rows without truncation.
3. **Pillar Preview Cards**:
   - Flat white cards with `1px solid #d9e2ec` border and rounded corners.
   - Hover transition: `-4px` vertical translate with subtle elevation shadow (`box-shadow: 0 10px 24px rgba(11, 94, 215, 0.08)`).
   - Category icon smoothly transitions background from neutral wash to brand blue with white icon glyph.
4. **Primary CTA**:
   - Large primary button (`Get Free Health Assessment`) with arrow icon and ripple animation effect.

---

### B. Wizard Progress Indicator (Step Track)
1. **Step Indicator States**:
   - 4 logical steps:
     - Step 1: Intake Form
     - Step 2: Processing
     - Step 3: Diagnostic Report
     - Step 4: Consultation
   - **Inactive**: Subtle white circle with grey outline (`#d9e2ec`), muted grey label text.
   - **Active (Current)**: Solid brand blue circle (`#0b5ed7`), white numeral, wrapped in an outer focus glow ring (`box-shadow: 0 0 0 4px rgba(11, 94, 215, 0.15)`).
   - **Completed**: Solid emerald green circle (`#198754`) with white check icon.
2. **Responsive Adaptation**:
   - On desktop screens, full step labels (*1. Profile & Documents*, *2. AI Processing*, *3. Health Report*, *4. Consultation*) appear below each circle.
   - On mobile screens (< 768px), step labels are omitted to prevent horizontal overflow; only numbered bullets and connecting rail remain visible.

---

### C. Drag-and-Drop Document Upload Dropzone
1. **Dropzone Architecture**:
   - Dashed border (`2px dashed #0b5ed7` or `#d9e2ec`), soft surface wash (`#f8fafc`), generous padding (40px top/bottom).
   - Central icon showing cloud-arrow-up, followed by title *"Drag & drop financial documents here or browse"*.
   - Format subtitle: *"Accepts P&L, Balance Sheet, GST Returns, Bank Statements (PDF, XLSX, CSV max 4MB)"*.
2. **Micro-Interactions**:
   - **Dragover**: Border switches to solid brand blue with an expanded subtle halo (`background: rgba(11, 94, 215, 0.04)`).
   - **Drop / Selection**: Native file picker opens upon clicking the zone.
   - **File Attached State**:
     - The dashed dropzone hides.
     - An active file preview pill displays the file name, formatted file size (in KB or MB), a green verification checkmark, and a red `"Remove"` button.
     - Clicking `"Remove"` clears the file input, revokes the file state, and displays the empty dropzone again.
3. **Client-Side Guardrails**:
   - Files larger than 4 MB trigger an immediate inline error alert.
   - Files with disallowed extensions (anything other than `.pdf, .xlsx, .xls, .csv`) trigger a friendly error alert and are immediately cleared.

---

### D. Live Processing Animation Screen (Step 2)
1. **Visual Atmosphere**:
   - Centered card container with generous vertical breathing room.
   - Smooth rotating SVG circular spinner (`stroke: #0b5ed7`).
   - Headline: *"Analyzing Your Business Health..."*.
2. **Sequential Status Progression**:
   - Five distinct milestone items sequentially light up with green checkmarks:
     1. *Validating company profile & operational parameters...*
     2. *Sanitizing statutory PII (PAN, GSTIN, Bank details)...*
     3. *Evaluating against 24 internal financial & operational criteria...*
     4. *Synthesizing strategic growth roadmap & insights...*
     5. *Finalizing preliminary Business Health Report...*
   - Each item fades in with a smooth opacity transition, demonstrating thorough behind-the-scenes evaluation.

---

### E. Preliminary Business Health Report Display (Step 3)
1. **Report Header**:
   - Clean enterprise header displaying Report ID (`BMR-YYYYMMDD-XXXX`), Company Name, Industry Sector, Turnover Band, and Timestamp.
2. **Radial Score Dial & Risk Classification**:
   - Large 140px circular score dial displaying the deterministic overall score (0–100) in bold typography.
   - Dynamic color assignment:
     - 80.0–100: Emerald green border and accent (`Strong`)
     - 60.0–79.9: Sapphire blue border and accent (`Moderate`)
     - 40.0–59.9: Warm amber border and accent (`Vulnerable`)
     - 0–39.9: Ruby red border and accent (`Critical`)
   - Prominent pill badge displaying the risk band name with matching background and border.
3. **6 Pillar Breakdown Cards**:
   - Grid of 6 distinct cards, each displaying:
     - Pillar title and max points.
     - Progress bar dynamically filled to the exact earned percentage.
     - Status badge (*Good*, *Average*, *Attention Needed*).
4. **Strategic Insights & Action Plan**:
   - Two-column comparative layout: *Key Strengths* (green tint, check icon) vs *Critical Gaps* (amber/red tint, warning icon).
   - 30 / 60 / 90 Day Strategic Roadmap organized into chronological cards.
5. **Action Controls**:
   - `"Print / Save PDF Report"`: Triggers `window.print()` with `@media print` rules hiding wizard headers and navigation buttons.
   - `"Analyze Another Business"`: Resets wizard state to Step 1 with a clean form.
   - `"Discuss Your Report With a Senior Consultant"`: Prominent primary button advancing to Step 4.

---

### F. Cal.com Consultation Scheduling (Step 4)
1. **Embedded Calendar**:
   - Mounted seamlessly inside `#cal-inline-embed` with responsive height (`650px`).
   - Automatically pre-populates visitor's Name, Email, Phone, and Assessment ID.
2. **Ad-Blocker & Offline Fallback**:
   - If third-party scripts fail to load or are blocked by browser privacy shields:
     - Displays direct scheduling button link to `https://cal.com/bookmyrecords/checkup-consultation`.
     - Displays direct telephone consultation link to `+91 96696 93315`.
