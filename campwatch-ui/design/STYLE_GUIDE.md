# Moondock UI — Style Guide

Source of truth: `campwatch/campwatch-ui/src/index.css` `:root` block and
utility class definitions.

---

## 1. Color tokens

All values are defined as CSS custom properties on `:root` and should be
referenced as `var(--token)` in CSS and as `text-[var(--token)]` etc. in
Tailwind classes. **Never hard-code hex values in component files.**

### Background / surface

| Token | Value | Use |
|-------|-------|-----|
| `--bg` | `#0d1a11` | Page background (outermost layer) |
| `--surface` | `#152017` | Cards, drawers, topbar glass |
| `--surface2` | `#1e2e22` | Inputs, dropdown lists, tab backgrounds |
| `--border` | `rgba(100,140,80,0.20)` | All 1px borders |

Surface hierarchy: `--bg` → `--surface` → `--surface2`. An element one level
up in the UI stack uses one level darker surface. Never skip a level.

### Brand

| Token | Value | Use |
|-------|-------|-----|
| `--primary` | `#5a8a3c` | Primary actions (CTA buttons, focus rings, active selections) |
| `--accent` | `#c8a45e` | Secondary highlights, active nav items, match scores, prices |

Pairing rule: `--primary` text goes on `--surface` or `--bg`. `--accent` text
goes on `--bg` or dark surfaces. **Do not pair accent on surface2** — contrast
is marginal.

### Text

| Token | Value | Use |
|-------|-------|-----|
| `--text` | `#e4ddd0` | Primary body text, headings, inputs |
| `--muted` | `#8a9980` | Secondary text, labels, placeholders, empty states |

### Semantic

| Token | Value | Use |
|-------|-------|-----|
| `--error` | `#c05a45` | Errors, delete actions, cancelled status |
| `--success` | `#4a9a5a` | Confirmations, completed status |

### Derived alpha tints (patterns used across components)

These are not tokens but recurring patterns. Codify them here for consistency.

| Purpose | Formula | Example usage |
|---------|---------|---------------|
| Primary tinted background | `rgba(90,138,60,0.16)` | Selected list item row |
| Primary tinted hover | `rgba(90,138,60,0.12)` | Hover on dropdown option |
| Accent tinted background | `rgba(200,164,94,0.14)` | Match score badge, active tab |
| Accent tinted border | `rgba(200,164,94,0.25)` | Active nav-item border |
| Error tinted background | `rgba(192,90,69,0.12)` | Danger button hover, flash error bg |
| Error tinted border | `rgba(192,90,69,0.35)` | Flash error border, danger button border |
| Success tinted background | `rgba(74,154,90,0.10)` | Flash success bg |
| Success tinted border | `rgba(74,154,90,0.35)` | Flash success border |

---

## 2. Typography

Base: `Inter, -apple-system, 'Helvetica Neue', Arial, sans-serif`. Font size
`15px`, line-height `1.6`.

### Named text styles

| Class | Size | Weight | Color | Letter-spacing | Use |
|-------|------|--------|-------|----------------|-----|
| `.page-title` | `1.75rem` | 600 | `--text` | — | Page H1 |
| `.page-subtitle` | `0.875rem` | 400 | `--muted` | — | Page H1 sub-line |
| `.section-label` | `0.6875rem` | 600 | `--muted` | `0.18em` | Section headers (ALL CAPS) |
| `.field-label` | `0.8125rem` | 500 | `--muted` | — | Form field labels |
| `topbar-brand` | `0.9375rem` | 600 | `--text` | `0.04em` | Brand wordmark in topbar |
| `topbar-page` | `0.8125rem` | 400 | `--muted` | — | Current page name in topbar |

### Scale for headings inside cards

Not defined as utility classes yet — use these Tailwind equivalents
consistently across all component files:

| Level | Tailwind | Use |
|-------|---------|-----|
| Card title | `text-xl font-semibold` | SiteCard campground name, TripCard title |
| Sub-heading | `text-lg font-semibold` | Section heading inside a card |
| Body | `text-sm` (14px) | Descriptions, metadata, list items |
| Micro | `text-xs` (12px) | Provider labels, id chips, tracking text |

**Issue to fix:** `.page-title` on `HomePage` is overridden to `text-5xl
md:text-6xl` for the hero. This is an intentional exception. All other pages
should use `.page-title` only.

---

## 3. Spacing

Base unit: `0.25rem` (4px). Use multiples of this unit for all spacing.

### Common values

| Value | rem | px | Use |
|-------|-----|----|-----|
| `gap-1` | 0.25 | 4 | Tight chip clusters |
| `gap-2` | 0.5 | 8 | Button groups, tag lists |
| `gap-3` | 0.75 | 12 | Most flex row gaps |
| `gap-4` | 1.0 | 16 | Grid column gaps, form field gaps |
| `gap-5` | 1.25 | 20 | Form section gaps |
| `gap-6` | 1.5 | 24 | Card-to-card vertical rhythm |
| `gap-8` | 2.0 | 32 | Hero section gap |

### Card padding

| Breakpoint | Padding |
|-----------|---------|
| Mobile (<768px) | `1.5rem` (24px) all sides |
| Desktop (≥768px) | `2rem` (32px) all sides |

Defined by `.content-card` — do not override inline.

### Page vertical rhythm

- `mb-6` (1.5rem) between the page header block and the first content section.
- `space-y-4` between TripCard rows.
- `mt-4` for secondary content within a form section.
- `py-8` top/bottom padding inside PageShell (applied by `my-auto` wrapper).

---

## 4. Shape / radius

| Token | Value | Use |
|-------|-------|-----|
| `--radius` | `0.5rem` (8px) | Buttons, inputs, chips, SiteCard/TripCard border-radius |
| `1rem` (16px) | hardcoded | `.content-card`, `.empty-state` border-radius |
| `9999px` | Tailwind `rounded-full` | Status badges, tab chips, selected-item pills |

**Current inconsistency:** `SiteCard`, `TripCard`, and `LogPage`'s recent-entry
articles use `rounded-[var(--radius)]` directly (correct). `content-card` uses
a hardcoded `1rem`. These are intentionally different (cards are visually
larger/softer). Keep both.

---

## 5. Shadows

| Token / value | Use |
|--------------|-----|
| `box-shadow: 0 12px 32px rgba(0,0,0,0.38)` | `.content-card`, `.empty-state` |
| `shadow-2xl` (Tailwind) | Hero search form on `HomePage` |
| `shadow-sm` | `SiteCard` |
| `box-shadow: 4px 0 24px rgba(0,0,0,0.4)` | `.nav-drawer` |

---

## 6. Borders

All borders use `1px solid var(--border)` unless noted.

| Exception | Value | Use |
|-----------|-------|-----|
| Dashed placeholder | `border-dashed border-[var(--border)]` | Disabled/empty picker slot |
| Accent selected | `!border-[var(--accent)]` | Provider button — selected state (HomePage) |
| Active nav item | `rgba(200,164,94,0.25)` | `.nav-item.active` |

---

## 7. Animation / transitions

| Rule | Duration | Easing | Applied to |
|------|----------|--------|-----------|
| Buttons (opacity, bg, color) | `0.15s` | `ease` | All `.btn` variants |
| Nav drawer slide | `0.22s` | `cubic-bezier(0.4,0,0.2,1)` | `.nav-drawer` transform |
| Tab chips / nav items | `0.15s` | `all` shorthand | `.tab-chip`, `.nav-item` |

---

## 8. Breakpoints

Moondock uses Tailwind v4 breakpoints. The relevant ones are:

| Prefix | Width | Notes |
|--------|-------|-------|
| `sm:` | ≥640px | 2-column form grids |
| `md:` | ≥768px | Card padding increase; hero text scaling |
| `lg:` | ≥1024px | Two-column page layouts (Reserve, Home hero) |

Target smallest supported viewport: **375px** (iPhone SE / most Android phones).

---

## 9. Design tokens — what is NOT yet a token

These values are used repeatedly across components but are not in `:root`.
Recommend adding them in a future pass:

| Recommended token | Value | Currently hardcoded in |
|-------------------|-------|----------------------|
| `--shadow-card` | `0 12px 32px rgba(0,0,0,0.38)` | `.content-card`, `.empty-state` |
| `--radius-card` | `1rem` | `.content-card`, `.empty-state` |
| `--radius-full` | `9999px` | `.tab-chip`, status badges |
| `--surface-accent` | `rgba(200,164,94,0.14)` | Match score badge, picker chips |
| `--surface-primary` | `rgba(90,138,60,0.16)` | Selected list rows |
| `--surface-error` | `rgba(192,90,69,0.12)` | Danger hover, flash bg |
| `--surface-success` | `rgba(74,154,90,0.10)` | Flash success bg |
