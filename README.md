# Handoff: Document Template Editor — v10

## Overview
This package contains the v10 prototype of the **Document Template Editor** for Booqable. The editor allows users to customise invoice/quote/contract PDF templates: show/hide and reorder sections, configure line-item columns, control branding and typography, set page size and document numbering, add rich-text sections, and write custom CSS overrides.

## About the Design Files
The files in this bundle are **design references created as React/HTML prototypes** — they show the intended look, behaviour, and interactions, but are not production code to ship directly. The goal is to **recreate these designs inside the existing Booqable front-end codebase** (Ember.js + Booqable design system), using its established patterns, components, and libraries.

## Fidelity
**High-fidelity.** This is a pixel-close prototype with final colours (from the Booqable design token system), typography (Proxima Nova), spacing, and interactions. Recreate the UI as closely as possible using existing Booqable components and patterns.

---

## Running the Prototype Locally

```bash
# Install the tiny local dev server once:
npm install

# Run the prototype with live reload:
npm run dev

# Then open http://localhost:3000
```

This dev server watches the prototype files and refreshes the browser automatically when you edit the HTML, JSX, or CSS.

The prototype requires an internet connection for:
- Font Awesome icons (`kit.fontawesome.com`) — replace with your internal FA Pro setup
- React + Babel CDN — swap for your bundler in production

---

## Screens / Views

### Main Layout (`ExpN` in `App.jsx`)
A three-zone layout at **1280 × 780px**:

| Zone | Width | Description |
|------|-------|-------------|
| Left sidebar | 220px | Section list + Settings / Branding shortcut buttons |
| Center preview | flex (with zoom) | Live scaled document preview |
| Right side panel | 220px (slides in when a section is active) | Per-section settings panel |

#### Top bar (height: 44px)
- Left: Template selector dropdown (styled as a read-only chip), breadcrumb path
- Right: "Reset" button (ghost, red text), "Save changes" primary button
- Background: `#fff`, border-bottom: `1px solid var(--grey-30)`

#### Left Sidebar
- Template name display (`Default invoice`) — read-only input-style chip
- Two shortcut buttons side-by-side: **Settings** (gear icon) and **Branding** (palette icon)
  - Active state: `background: var(--blue-5)`, `border: 1px solid var(--blue-60)`, `color: var(--blue-60)`
- Section list (drag-to-reorder via HTML5 drag API):
  - Each row: 36px min-height, `padding: 0 8px 0 14px`
  - Hover: `background: var(--grey-10)`, left border `3px solid var(--blue-60)`
  - Hidden sections: `opacity: 0.45`, label struck-through
  - On hover: eye (show/hide) + grip-lines (drag handle) buttons appear — `opacity: 0 → 1`
  - Text sections show a small "Text" badge (`var(--grey-10)` bg, 9px)
  - Click on label → opens that section's settings panel (right side)

#### Center Preview
- White document card with `border: 1px solid var(--grey-30)`, `border-radius: 6px`
- Wrapped in a scrollable container with zoom transform applied
- `transform-origin: top center`, zoom steps: `[0.5, 0.67, 0.75, 0.9, 1, 1.1, 1.25, 1.5]`
- In **Edit mode**: hovering a section shows a `2px solid var(--blue-30)` outline; active section shows `2px solid var(--blue-60)`
  - "Add text section above/below" pill buttons appear on hover at section borders
  - An edit badge (blue pill, "✏ Section name") appears top-right of hovered/active section

#### View Toolbar (bottom-right, floating)
- White pill with shadow: `box-shadow: 0 2px 10px rgba(0,0,0,.09)`
- Left segment: Edit / Preview toggle buttons (active = blue filled)
- Divider
- Zoom out (−), zoom % display (click to reset to 100%), zoom in (+)

---

## Section Panels (right sidebar, 220px wide)

All panels share:
- Back-navigation button at top (chevron-left + section label), `height: 40px`, `border-bottom: 1px solid var(--grey-20)`
- Scrollable body `padding: 0 14px`
- Section headers: `font-size: 10px`, `font-weight: 700`, `text-transform: uppercase`, `letter-spacing: .07em`, `color: var(--grey-50)`, `padding: 11px 0 5px`

### Header panel
- **Company logo** toggle (show/hide)
- **Contact details** toggle (phone, website, address)
- **Logo alignment** — 3-button group: Left / Center / Right

### Logistics & dates panel
- **Pickup & return dates** toggle
- **Location name** toggle
- **Date format** radio group:
  - "Show date and time" — appends ` 10:00` to dates in preview
  - "Show date only"

### Line items panel
**Columns** sub-section (drag-to-reorder list):
- Each column row: same hover/drag pattern as sidebar sections
- Columns with options get an inline `<select>` when enabled (e.g. Qty shows `1x / 2x / Per unit`)
- Eye icon button to toggle visibility
- Disabled columns: `opacity: 0.45`, label struck-through

**Bundle item pricing** sub-section (separate, not draggable):
- Toggle to group bundle items with combined pricing row in preview
- When on: preview shows a "📦 Camera Bundle Kit" group header, sub-items in italic, bundle total row

### Totals & fees panel
- **Discount line** toggle
- **Security deposit** toggle

### Footer panel
- **Payment note** toggle

### Text section panel
- **Formatting toolbar** (row 1): Style dropdown (Normal / H1 / H2 / H3), Bold, Italic, Underline, Strikethrough
- **Formatting toolbar** (row 2): Bullet list, Numbered list, | divider, Align left/center/right
- **Content textarea**: 90px tall, reflects active formatting visually, `font-family: var(--font-body)`
- **Insert variable** chips: `{{customer_name}}`, `{{order_number}}`, `{{date}}`, `{{due_date}}`, `{{company_name}}`, `{{total}}`
  - Style: `height: 22px`, `background: var(--blue-5)`, `color: var(--blue-60)`, `border: 1px solid var(--blue-30)`, `border-radius: 10px`, `font-size: 10px`
- **Remove text section** button sticky at bottom (full-width, red/danger)

### Settings panel
- **Font family** select: Inter / Helvetica / Georgia / Garamond / Courier
- **Page size** button group: A4 / Letter / Legal / A5
  - Active: `background: var(--blue-5)`, `border: var(--blue-60)`, `color: var(--blue-60)`, `font-weight: 600`
- **Document numbering** radio:
  - Global level (default)
  - Prefix level
- **Invoice due dates** toggle + description text
- **Custom CSS** textarea: `height: 110px`, monospace font, `background: #fafafa`

### Branding panel
- **Brand color** + **Secondary color** — color rows with hex display chip + native `<input type="color">` swatch
- **Logo** — thumbnail preview (90px tall) + "Change" button
- **Reset to org defaults** sticky footer button

---

## Interactions & Behaviour

### Drag-to-reorder (sections + columns)
Uses HTML5 `draggable` + `onDragStart` / `onDragOver` / `onDrop`. On drop, splices the item from its source index and inserts at the target index.

### Add text section
Hovering any section in the preview shows "Add text section above / below" pill buttons. Clicking one inserts a new `{type: 'text'}` section at the correct index and immediately opens its panel.

### Reset modal
"Reset" button in top bar opens a confirmation modal (`position: fixed`, overlay `rgba(0,0,0,.4)`):
- Title: "Reset to defaults"
- Body: "All customisations will be lost. This cannot be undone."
- Actions: Cancel + "Reset" (danger)
- Confirming resets: `docCfg`, `dateFormat`, `pageSize`, `docNumLevel`, `dueDatesOn`, `customCSS`, `blockData`

### Preview ↔ Edit mode
Edit mode: hover outlines, add-section buttons, sidebar editing all active.
Preview mode: all editing UI hidden, document shows as-is.

### Zoom
`transform: scale(zoom)` applied to the document container. Zoom % display resets to 100% on click.

---

## State Shape

```js
// Section list
sections: Array<{
  id: string,          // 'header' | 'logistics' | 'lineitems' | 'totals' | 'footer' | custom string
  type: 'builtin' | 'text',
  label: string,
  visible: boolean,
}>

// Line items
lineItems: Array<{
  id: string,
  label: string,
  drag: boolean,
  on: boolean,
  dropdown: null | { val: string, opts: string[] },
  special?: boolean,   // bundle item — rendered separately
}>

// Document config
docCfg: {
  primaryColor: string,   // hex, default '#136DEB'
  showLogo: boolean,
  showContact: boolean,
  showDates: boolean,
  showLocation: boolean,
  showDiscount: boolean,
  showDeposit: boolean,
  footerNote: boolean,
  font: string,           // 'Inter' | 'Helvetica' | 'Georgia' | 'Garamond' | 'Courier'
}

// Text section block content (keyed by section id)
blockData: Record<string, {
  text: string,
  textStyle: 'normal' | 'h1' | 'h2' | 'h3',
  bold: boolean,
  italic: boolean,
  underline: boolean,
  strikethrough: boolean,
  bulletList: boolean,
  numberedList: boolean,
  align: 'left' | 'center' | 'right',
}>

// Settings
dateFormat: 'datetime' | 'dateonly'
pageSize: 'A4' | 'Letter' | 'Legal' | 'A5'
docNumLevel: 'global' | 'prefix'
dueDatesOn: boolean
customCSS: string

// Branding
brandColor: string     // hex
secondColor: string    // hex

// UI
editing: null | string         // section id | '__settings__' | '__branding__'
mode: 'edit' | 'preview'
zoom: number                   // one of ZOOM_STEPS
```

---

## Design Tokens

All tokens are in `colors_and_type.css` as CSS custom properties. Key values used in this component:

| Token | Value | Usage |
|-------|-------|-------|
| `--blue-60` | `#136DEB` | Primary brand, active states, buttons |
| `--blue-5` | `#EDF5FF` | Active button backgrounds, chip fills |
| `--blue-30` | `#BBDBFA` | Hover outlines, chip borders |
| `--grey-10` | `#EDF1F5` | App background, hover row background |
| `--grey-20` | `#E0E4E8` | Dividers |
| `--grey-30` | `#D6D9DB` | Borders, inactive toggles |
| `--grey-40` | `#A4A7A8` | Muted icons |
| `--grey-50` | `#546972` | Secondary text, section headers |
| `--grey-60` | `#415158` | Body icons |
| `--black` | `#131314` | Primary text |
| `--red-60` | `#E51C2C` | Danger/delete actions |
| `--font-body` | `'Proxima Nova', -apple-system, …` | All UI text |

### Inline token alias (`BQ` object in prototype)
The prototype uses a `BQ` constant (defined in `App.jsx` top, sourced from `components.jsx` globals) mapping short keys to these values:

```js
const BQ = {
  blue: '#136DEB',   blue5: '#EDF5FF',   blue30: '#BBDBFA',
  grey10: '#EDF1F5', grey20: '#E0E4E8',  grey30: '#D6D9DB',
  grey40: '#A4A7A8', grey50: '#546972',  grey60: '#415158',
  black: '#131314',  white: '#FFFFFF',   bg: '#EDF1F5',
  red: '#E51C2C',
}
```

---

## Toggle Component Spec

```
SmTog (small, 34×18px):  track border-radius 9px, thumb 12×12px, left: on=19px / off=3px
Tog   (std,   32×17px):  track border-radius 9px, thumb 11×11px, left: on=18px / off=3px
Active track color: var(--blue-60)
Inactive track color: var(--grey-30)
Thumb: white circle, transition: left 180ms
```

---

## Assets & Fonts

| Path | Description |
|------|-------------|
| `fonts/ProximaNova-*.otf/.ttf` | Licensed Proxima Nova — use your existing copy in the codebase |
| `assets/logo.svg` | Booqable logo SVG (used in top nav chrome) |
| Font Awesome 6 Pro | Icons via `fa-regular fa-*` — use your internal FA Pro kit |

**Note on Font Awesome:** The prototype loads FA via a CDN kit (`kit.fontawesome.com/ff3b3de2b5.js`). In production use the Booqable internal FA Pro setup so all `fa-regular` icons resolve correctly.

---

## Files in This Package

| File | Purpose |
|------|---------|
| `index.html` | Standalone entry point — renders v10 directly, no canvas wrapper |
| `App.jsx` | Full v10 component (`ExpN`) — all logic and JSX |
| `components.jsx` | Shared Booqable UI atoms: `Icon`, `Avatar`, `Badge`, `Button`, `Input`, `Field`, `Card`, `VCard` |
| `colors_and_type.css` | Full Booqable design token CSS (colours, spacing, typography, shadows, radii) |
| `fonts/` | Proxima Nova font files (all weights) |
| `assets/` | Logo SVG and other static assets |

---

## Key Implementation Notes for Claude Code

1. **`ExpN` is self-contained** — all state, sub-components, and render logic live inside the single function component in `App.jsx`. Split into smaller components as appropriate for your codebase conventions.

2. **Font Awesome icons** — every icon is `<i className="fa-regular fa-{name}">`. The `FI` atom in `ExpN` wraps this with size/color props. Map to your internal icon component.

3. **Drag-and-drop** — uses native HTML5 drag API (`draggable`, `onDragStart`, `onDragOver`, `onDrop`). You may want to replace with your existing DnD library (e.g. `@dnd-kit`).

4. **No external state management** — all state is local React `useState`. Wire up to your API / store layer as needed.

5. **The `BQ` colour object** is defined at the top of `App.jsx` — replace references with CSS custom properties or your design token system.

6. **Text section debounce** — the `TextSectionPanel` debounces textarea input at 120ms to avoid re-rendering the preview on every keystroke. Keep this pattern.

7. **Zoom** — implemented as `transform: scale(zoom)` on the document wrapper with `transform-origin: top center`. The containing scroll div uses a calculated `minHeight` to prevent layout collapse.
