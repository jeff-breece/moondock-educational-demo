# Moondock UI — Layout Specification

Source files:
- `components/PageShell.tsx`
- `components/TopBar.tsx`
- `components/HamburgerNav.tsx`
- `index.css` (`.page-root`, `.topbar`, `.nav-drawer`)

---

## 1. Fixed top bar

The `TopBar` component renders a fixed header at the top of every page.

```
┌─────────────────────────────────────────────────────┐
│  ≡  Moondock  /  Page Name                         │  ← 56 px
└─────────────────────────────────────────────────────┘
```

| Property | Value | Token / class |
|----------|-------|---------------|
| Height | 56 px | `--topbar-h: 56px` |
| Position | `fixed` | `.topbar` |
| `z-index` | `40` | `.topbar` |
| Background | `--surface` with `backdrop-filter: blur(12px)` | `.topbar` |
| Left element | Hamburger button (`mif-menu` Metro icon), 36 × 36 px — `aria-label="Open navigation"` | hard-coded |
| Centre-left | Brand word-mark ("Moondock") | `.topbar-brand` |
| Centre-right | Separator `/` + page label | `.topbar-page` |

> **Note (updated):** The hamburger icon was changed from `☰` (Unicode character) to the Metro UI icon font class `mif-menu` as part of the Metro icon system migration.

**Page labels** are determined by `PAGE_LABELS` inside `TopBar.tsx`:

| Route | Label |
|-------|-------|
| `home` | *(blank — brand only)* |
| `results` | `Search Results` |
| `reserve` | `Plan a Trip` |
| `history` | `Trip History` |
| `log` | `Trip Log` |

---

## 2. Navigation drawer

`HamburgerNav` slides in from the left edge over the page content.

```
┌───────────────────┬────────────────────────────┐
│  × Moondock      │░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│  ─────────────── │░░░ overlay (semi-opaque) ░░│
│  🔍 Search       │░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│  📋 Results      │░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│  🗓  My Trips    │░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│  📝 Plan a Trip  │░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│  🌲 Trip Log     │░░░░░░░░░░░░░░░░░░░░░░░░░░░│
└───────────────────┴────────────────────────────┘
```

| Property | Value | Token / class |
|----------|-------|---------------|
| Width | 17 rem (272 px) | `.nav-drawer` |
| Position | `fixed`, left 0, full height | `.nav-drawer` |
| `z-index` | `50` | `.nav-drawer` |
| Open transform | `translateX(0)` | `.nav-drawer.open` |
| Closed transform | `translateX(-100%)` | `.nav-drawer` |
| Transition | `0.22s cubic-bezier(0.4,0,0.2,1)` | `.nav-drawer` |
| Overlay | `rgba(0,0,0,0.55)`, `z-index: 49` | `.nav-overlay` |

**Active nav item** uses an accent underline + left-border indicator:
```css
.nav-item.active { color: var(--accent); border-left: 2px solid rgba(200,164,94,0.5); }
```

---

## 3. PageShell

The layout wrapper used by **4 of 5 pages** (all except `HomePage`).

```tsx
<PageShell width="medium">
  {/* page content */}
</PageShell>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `width` | `'narrow' \| 'medium' \| 'wide'` | `'medium'` | Max-width of inner column |
| `noPad` | `boolean` | `false` | Removes `py-8` vertical padding from content wrapper |

### Width values

| Value | Tailwind class | Max-width |
|-------|---------------|-----------|
| `narrow` | `max-w-2xl` | 672 px (42 rem) |
| `medium` | `max-w-5xl` | 1024 px (64 rem) |
| `wide` | `max-w-7xl` | 1280 px (80 rem) |

### DOM structure

```
div.page-root                        ← padding-top: 56px (topbar offset), min-height: 100vh
  div.mx-auto.w-full.max-w-{N}       ← width constraint + horizontal padding (px-4 md:px-6)
    div.w-full.py-8.my-auto          ← vertical centering + padding (omitted when noPad=true)
      {children}
```

The `my-auto` on the inner div vertically centres short content in the
viewport. For pages with more content than the viewport height, it simply adds
equal top/bottom padding. This is correct behaviour.

### Current usage

| Page | Width | noPad |
|------|-------|-------|
| `ResultsPage` | `medium` | false |
| `HistoryPage` | `medium` | false |
| `ReservePage` | `medium` | false |
| `LogPage` | `medium` | false |
| `HomePage` | **bypassed** | — |

---

## 4. HomePage — special layout

`HomePage` does not use `PageShell`. It implements its own centred layout:

```tsx
<div className="flex min-h-screen flex-col items-center justify-center px-4 pt-14 pb-10">
```

| Property | Value | Note |
|----------|-------|------|
| Top padding | `pt-14` (3.5 rem = 56 px) | Matches `--topbar-h`. Should be `pt-[var(--topbar-h)]` for robustness (HP-1, P3). |
| Centring | `items-center justify-center` on a `min-h-screen` flex column | Vertically centres content |
| Inner wrapper | `max-w-5xl` (medium width) | Matches other pages |
| Grid at `lg:` | `lg:grid-cols-[1fr_1.1fr] lg:items-center` | Hero text left / form right |

### Hero text column (left at lg)

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│  WILDERNESS CAMPING                                  │  ← .section-label
│  Moondock                                            │  ← text-5xl / text-6xl
│  ──────────────────                                  │
│  Plan your next primitive camp without a cell signal │  ← body text
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Search form column (right at lg)

```
┌──────────────────────────────────────────────────────┐
│  Choose a provider                                   │  ← .field-label
│  [Ohio] [Recreation.gov] [ReserveAmerica] [UsDirect] │  ← provider grid
│                                                      │
│  Destination type                                    │  ← .field-label
│  [● Campground]   [○ Recreation Area]                │  ← segmented control
│                                                      │
│  Find a campground ──────────────────                │  ← CamplyPicker
│                                                      │
│  Arrive ──────────   Depart ──────────               │  ← 2-col date inputs
│                                                      │
│  □ Tent-only     □ No hookups                        │  ← equipment checkboxes
│                                                      │
│  [    Search Available Sites    ]                    │  ← .btn-primary
└──────────────────────────────────────────────────────┘
```

---

## 5. Standard page header pattern

All four `PageShell`-wrapped pages use a centred page header block above the
first content section. The exact structure should be standardised (see
COMPONENT_LIBRARY §PageHeader recommendation).

### Current implementation (consistent across all 4 pages)

```tsx
<div className="mb-6 text-center">
  <p className="section-label">Section Label</p>
  <h1 className="page-title">Page Title</h1>
  {/* optional subtitle */}
  <p className="page-subtitle mt-1">Brief description.</p>
</div>
```

### Variations by page

| `HistoryPage` | `+ New Trip` button uses `absolute right-0 top-1/2 -translate-y-1/2` inside a `relative text-center` wrapper. Title is truly centred; button floats right. ✅ |
| `ReservePage` | "Open Booking →" external link rendered in a flex row below the subtitle alongside "← Back to Results". ✅ |
| `LogPage` | `← History` ghost button rendered **above** the header block as a standalone element before the centred `<div>`. ✅ |
| `ResultsPage` | Clean — closest to the canonical pattern. ✅ |

**Recommendation:** Extract into a `PageHeader` component:

```tsx
<PageHeader
  sectionLabel="My Trips"
  title="Trip History"
  subtitle="Your planned and completed adventures."
  action={<button className="btn btn-primary btn-sm">+ New Trip</button>}
/>
```

---

## 6. Responsive grid patterns

### Two-column form layout (ReservePage)

```
Mobile (< 1024 px):          Desktop (≥ 1024 px):
┌────────────────────┐       ┌───────────────┬──────────────┐
│  Trip Details      │       │ Trip Details  │   Checklist  │
│  content-card      │       │ content-card  │ content-card │
│                    │       │               │              │
│  Checklist         │       │               │              │
│  content-card      │       │               │              │
└────────────────────┘       └───────────────┴──────────────┘
Tailwind: space-y-6          Tailwind: lg:grid-cols-2 gap-6
```

### Two-column hero (HomePage)

```
Mobile (< 1024 px):          Desktop (≥ 1024 px):
┌────────────────────┐       ┌──────────────┬───────────────┐
│  Hero text         │       │  Hero text   │  Search form  │
│  Search form       │       │  (1fr)       │  (1.1fr)      │
└────────────────────┘       └──────────────┴───────────────┘
Tailwind: stacked            Tailwind: lg:grid-cols-[1fr_1.1fr]
```

### Results grid (ResultsPage)

```
Mobile:   1 column (SiteCards stack)
sm (640px): 2 columns
lg (1024px): 3 columns
Tailwind: grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4
```

---

## 7. Horizontal padding

| Width | Mobile | Desktop |
|-------|--------|---------|
| PageShell content | `px-4` (16 px) | `md:px-6` (24 px) |
| HomePage wrapper | `px-4` (16 px) | — |
| TopBar | `px-4` (16 px) | `md:px-6` (24 px) |
| Nav drawer | `px-5` (20 px) | — |

---

## 8. Breakpoint summary

| Prefix | Width | Triggered layout change |
|--------|-------|------------------------|
| (none) | 0 px | Single column, stacked content |
| `sm:` | 640 px | Results grid 2-col; some form grids 2-col |
| `md:` | 768 px | PageShell px-6; card padding 2rem; hero text scaling |
| `lg:` | 1024 px | ReservePage 2-col; HomePage hero 2-col |

---

## 9. z-index stack

| Layer | z-index | Element |
|-------|---------|---------|
| Background | `-1` | `AppBackground` |
| Page content | `0` | Regular page content |
| Sticky filter bar | `10` | ResultsPage filter card (recommended, not yet implemented) |
| TopBar | `40` | `.topbar` |
| Nav overlay | `49` | `.nav-overlay` |
| Nav drawer | `50` | `.nav-drawer` |
| Dropdowns | `30` | `CamplyPicker` dropdown list |
