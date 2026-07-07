# Moondock UI — Component Library

All components are in `campwatch/campwatch-ui/src/components/`.

Issue IDs below correspond to `PAGE_AUDIT.md` for cross-referencing.

---

## 1. PageShell

**File:** `components/PageShell.tsx`

### Description
Wraps every page (except `HomePage`) with a top-padding equal to the fixed
topbar height, horizontal padding, and a max-width container centred on the
viewport.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | — | Page content |
| `width` | `'narrow' \| 'medium' \| 'wide'` | `'medium'` | Container max-width |

### Width values

| Value | Tailwind class | Max-width |
|-------|---------------|-----------|
| `narrow` | `max-w-xl` | 672 px (42rem) |
| `medium` | `max-w-4xl` | 1024 px (64rem) |
| `wide` | `max-w-6xl` | 1280 px (80rem) |

### Current usage

| Page | Width |
|------|-------|
| `ResultsPage` | `medium` |
| `HistoryPage` | `medium` |
| `ReservePage` | `medium` |
| `LogPage` | `medium` |
| `HomePage` | **Not used** — custom hero layout |

### Known issues
- No issue with the component itself.
- `HomePage` bypasses it entirely; see PAGE_AUDIT §HP.

### Recommended use
All five pages should use `PageShell`. `HomePage` can keep its internal
centering while still using `PageShell width="wide"` as the outermost wrapper
to ensure consistent top-offset handling.

---

## 2. TopBar

**File:** `components/TopBar.tsx`

### Description
Fixed top bar (56 px / `--topbar-h`). Contains a hamburger toggle button, the
brand word-mark, and a current-page label.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `pageLabel` | `string` | `''` | Current page name shown right of brand |
| `onMenuClick` | `() => void` | — | Called when hamburger is clicked |

### Known issues

| ID | Issue | Priority |
|----|-------|----------|
| TB-1 | Hamburger uses `☰` text character — not a semantic icon. However, the button already has `aria-label="Open navigation"` so screen readers are handled. The visual inconsistency remains (OS font differences). | P3 |
| TB-2 | ~~`pageLabel` not driven by route~~ — **Not an issue.** `TopBar` receives `currentPage: RoutePage` and derives the label from a built-in `PAGE_LABELS` map. All four non-home pages display their label. Home page shows blank (intentional). | ✅ |

### Recommended fix — TB-2
Derive `pageLabel` from the current route (`useLocation` + a route-to-label map)
inside `App.tsx` or a layout component, rather than leaving it empty. The CSS
rule for the page label is already in place.

### Recommended fix — TB-1
Replace `☰` with an SVG icon or a CSS hamburger (`span` stack) and add
`aria-label="Open navigation"`.

---

## 3. HamburgerNav

**File:** `components/HamburgerNav.tsx`

### Description
Slide-in navigation drawer (from the left). Shows five nav items and a close
button. Includes a semi-transparent overlay that closes the drawer on click.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | — | Whether the drawer is visible |
| `onClose` | `() => void` | — | Called when overlay or close button is clicked |

### Nav items (current)

| Label | Icon | Route |
|-------|------|-------|
| Search | 🔍 | `/` |
| Results | 📋 | `/results` |
| My Trips | 🗓 | `/history` |
| Plan a Trip | 📝 | `/reserve` |
| Trip Log | 🌲 | `/log` |

### Known issues

| ID | Issue | Priority |
|----|-------|----------|
| HN-1 | Emoji icons render differently across OS/font stacks (Windows vs macOS vs Android). No consistent visual weight. | P2 |
| HN-2 | Close button uses `×` text character — same semantic/a11y issue as TB-1. Needs `aria-label="Close navigation"`. | P2 |
| HN-3 | Active nav item is highlighted by accent underline but the entire item is not clearly differentiated for users who rely on colour contrast alone. | P3 |
| HN-4 | Drawer does not trap focus — tab order escapes the drawer when open. | P2 |

### Recommended fixes
- HN-1/HN-2: Replace emoji icons and `×` with SVG icons (e.g., Heroicons or a
  small custom icon set). Keep the same layout.
- HN-4: Add `focus-trap` (can be implemented with a small custom hook) or
  `inert` attribute on the main content when drawer is open.

---

## 4. SiteCard

**File:** `components/SiteCard.tsx`

### Description
Renders a single campsite search result. Displays provider-reported facts in a
`<dl>` grid and derived estimated signals as `SignalChip` tiles.

### Props

| Prop | Type | Description |
|------|------|-------------|
| `result` | `CampsiteSearchRecord` | Full search result object |
| `onPlan` | `(result) => void` | Called when "Plan This Trip" is clicked |

### CampsiteSearchRecord (relevant fields)

| Field | Type | Notes |
|-------|------|-------|
| `provider` | `string` | Source provider name |
| `campgroundName` | `string` | Campground display name |
| `siteId` | `string \| null` | Site identifier |
| `checkIn` / `checkOut` | `string` | ISO date strings |
| `matchScore` | `number` | Raw search score |
| `isReservable` | `boolean` | From provider |
| `bookingUrl` | `string \| null` | External booking link |

### Known issues

| ID | Issue | Priority |
|----|-------|----------|
| SC-1 | All layout uses Tailwind utility classes inline — no reuse of `.content-card` (card has its own equivalent padding but misses the box-shadow depth of `.content-card`). Consider whether `SiteCard` should simply extend `.content-card`. | P3 |
| SC-2 | "Match {result.matchScore}" badge has no unit or explanation. Users don't know what scale this is on or what it means. | P2 |
| SC-3 | `SignalChip` `title` tooltip shows signals separated by ` · ` — this works on desktop hover but is invisible on mobile/touch. | P2 |
| SC-4 | "Plan This Trip" and "View Booking Page" have no disabled/loading state — double-click can trigger duplicate navigation. | P3 |

---

## 5. TripCard

**File:** `components/TripCard.tsx`

### Description
A list-item card for trip history. Shows trip title, destination, dates, and
a status badge with two action buttons.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | — | Trip name |
| `destination` | `string` | — | Destination label |
| `dates` | `string` | — | Formatted date range |
| `status` | `string` | — | `'Completed'`, `'Booked'`, `'Cancelled'`, or any string |
| `onViewLog` | `() => void` | — | Navigate to LogPage for this trip |
| `onEdit` | `() => void` | — | Navigate to ReservePage to edit |
| `editLabel` | `string` | `'Edit'` | Label for the edit button |

### Status badge colours

| Status | Background | Text |
|--------|-----------|------|
| `Completed` | `rgba(74,154,90,0.16)` | `--success` |
| `Booked` | `rgba(200,164,94,0.16)` | `--accent` |
| `Cancelled` | `rgba(192,90,69,0.16)` | `--error` |
| Other / `Planned` | `rgba(90,138,60,0.16)` | `--primary` |

### Known issues

| ID | Issue | Priority |
|----|-------|----------|
| TC-1 | "View Log" button is always visible and enabled even when the trip has no journal entry. Clicking navigates to an empty LogPage with no feedback. | P2 |
| TC-2 | No visual cue distinguishing a `Trip` record from an `Outing` record — HistoryPage mixes both. | P2 |
| TC-3 | Card does not show trip duration or night count — only the date range string passed by the parent. | P3 |

### Recommended fix — TC-1
Accept a `hasLog?: boolean` prop. Render "View Log" as disabled (with a
tooltip) when `false`.

### Recommended fix — TC-2
Accept a `kind?: 'trip' | 'outing'` prop. Render a small pill or icon
to indicate the type.

---

## 6. ChecklistBuilder

**File:** `components/ChecklistBuilder.tsx`

### Description
An interactive checklist that allows adding, checking off, and removing items.
Used inside `ReservePage`.

### Props

| Prop | Type | Description |
|------|------|-------------|
| `items` | `ChecklistItem[]` | Current list items |
| `onChange` | `(items: ChecklistItem[]) => void` | Called on every mutation |

### ChecklistItem type

```ts
interface ChecklistItem {
  text: string;
  done: boolean;
}
```

### Known issues

| ID | Issue | Priority |
|----|-------|----------|
| CL-1 | Add button uses a mix of hardcoded Tailwind (`bg-[var(--primary)]`) instead of `.btn .btn-primary`. Inconsistent with the rest of the button system. | P2 |
| CL-2 | "Add item" input has no `onKeyDown` handler — pressing Enter does not add the item. | P2 |
| CL-3 | List item key is `${item.text}-${index}` — duplicate text labels cause stale React keys. Should use a stable `id` field. | P3 |
| CL-4 | "Remove" button text is a plain string — not a visually distinct icon. No `aria-label`. | P2 |

### Recommended fix — CL-2
Add `onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addItem(); } }}` to the input.

---

## 7. CamplyPicker

**File:** `components/CamplyPicker.tsx`

### Description
A combo-box component that supports seed (pre-loaded) items and live-search
(debounced fetch), single or multi-select, and displays selected items as
dismissible pill chips.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `provider` | `string` | — | Provider slug (used in API URL) |
| `searchType` | `'campgrounds' \| 'recreation-areas'` | — | API search type |
| `value` | `string[]` | — | Selected IDs |
| `onChange` | `(ids: string[]) => void` | — | Selection changed |
| `label` | `string` | — | Visible field label |
| `placeholder` | `string` | — | Input placeholder |
| `hint` | `string` | — | Helper text below input |
| `singleSelect` | `boolean` | `false` | Limit to one selection |
| `initQuery` | `string` | — | Query to pre-populate seed list |
| `minQueryLength` | `number` | `2` | Min chars before live search fires |
| `disabled` | `boolean` | `false` | Locks the control |

### Known issues

| ID | Issue | Priority |
|----|-------|----------|
| CP-1 | Dropdown list is capped at 30 items (`visibleItems.slice(0, 30)`) with no "X more…" count. Users don't know there are more options. | P2 |
| CP-2 | Loading spinner uses `⟳` text character — inconsistent with `Spinner` component used elsewhere. | P3 |
| CP-3 | When `singleSelect=true` and the dropdown closes on selection, focus does not return to the input. Screen readers lose position. | P2 |
| CP-4 | Keyboard navigation inside the dropdown list is not implemented — Tab does not cycle through options, arrow keys do nothing. | P2 |

---

## 8. Spinner

**File:** `components/Spinner.tsx`

### Description
A simple CSS-animated loading spinner. Used in `ResultsPage` during search.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Diameter of the spinner ring |

### Known issues

| ID | Issue | Priority |
|----|-------|----------|
| SP-1 | Not used in `HistoryPage` or `ReservePage` during data fetch. Those pages silently show empty content until data arrives. | P1 |

---

## 9. AppBackground

**File:** `components/AppBackground.tsx`

### Description
Renders a fixed full-viewport decorative background layer (gradient mesh,
subtle forest texture or noise). Sits behind all content at `z-index: 0`.

### Known issues
- No functional issues. The component does not affect content layout.

---

## Shared patterns (not a single component)

### Page header block

The standard page header pattern used in ResultsPage, HistoryPage, ReservePage,
and LogPage:

```tsx
<div className="mb-6 text-center">
  <p className="section-label">Section Name</p>
  <h1 className="page-title">Page Title</h1>
  <p className="page-subtitle">Optional subtitle</p>   {/* optional */}
</div>
```

**Current state:** This pattern is present on all four PageShell-wrapped pages
but with spacing variations:
- HistoryPage adds a `+ New Trip` button inside the header block (inline flex).
- ReservePage adds an "Open Booking →" link at the end of the header block.
- LogPage adds a "← History" ghost button before the block.

**Recommended standardisation:** Define a `PageHeader` component that accepts
`sectionLabel`, `title`, `subtitle`, and an optional `action` slot. This
ensures all pages use identical spacing and alignment.

### Flash messages

`.flash-success` and `.flash-error` are defined in `index.css`. Both use
the tinted background + border pattern described in STYLE_GUIDE §1.

**Current state:** HistoryPage and ReservePage use `.flash-success` correctly.
LogPage's photo upload error uses the raw Tailwind class `text-red-500` instead
of `flash-error` or `text-[var(--error)]`. See PAGE_AUDIT issue LG-1.
