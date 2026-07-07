# Moondock UI — Page Audit

## Priority key

| Level | Meaning |
|-------|---------|
| **P1** | Broken or severely degrades usability — fix immediately |
| **P2** | Inconsistency or noticeable friction — fix in next pass |
| **P3** | Polish / nice-to-have — fix when time allows |

Issue IDs match the `COMPONENT_LIBRARY.md` references where applicable
(e.g. TB-2 = TopBar issue 2). Page-specific issues use page-prefix codes:
`HP` = HomePage, `RP` = ResultsPage, `HI` = HistoryPage, `RE` = ReservePage,
`LG` = LogPage, `XC` = cross-cutting.

---

## Cross-cutting issues

These issues appear on every page (or on multiple pages) and should be fixed
once, not file-by-file.

| ID | Issue | Priority | Affected files |
|----|-------|----------|----------------|
| XC-1 | ~~**TopBar `pageLabel` is always empty.**~~ **Not an issue.** `TopBar` receives `currentPage` from `App.tsx` and derives the label from a `PAGE_LABELS` map. Home renders blank (intentional), all other pages show the correct label. No fix needed. | ✅ | — |
| XC-2 | **No standardised `PageHeader` component.** Every page implements its own section-label / page-title / subtitle block with slightly different spacing and flex alignment. | P2 | All pages |
| XC-3 | **Back navigation is inconsistent.** `LogPage` uses a "← History" ghost button above the header. `ReservePage` has no back button. `ResultsPage` has no back button. The `HamburgerNav` is the only universal back mechanism but requires two taps. | P2 | `ResultsPage`, `ReservePage`, `LogPage` |
| XC-4 | **No loading skeletons on initial data fetch.** `HistoryPage` and `LogPage`'s recent entries section show blank content until the fetch resolves. Only `ResultsPage` has a proper loading state. | P1 | `HistoryPage`, `LogPage` |
| XC-5 | **`Spinner` component is defined but only used in `ResultsPage`.** All other pages that load async data show nothing. | P1 | `HistoryPage`, `LogPage` |
| XC-6 | **Error handling on failed API calls is silent in most pages.** `HistoryPage` fetch failure leaves the page empty. `LogPage` recent-entries fetch failure leaves the section empty. No error message is shown. | P1 | `HistoryPage`, `LogPage` |
| XC-7 | **Navigation is SPA-local (`onNavigate`) with no URL update.** Browser back/forward buttons do nothing. Deep-linking to a page is not possible. This is an architectural gap, not a single-page fix — track separately. | P3 | `App.tsx`, router |

---

## HomePage

**Route:** `/` (page: `home`)
**File:** `pages/HomePage.tsx`
**Layout:** Custom full-viewport hero — does **not** use `PageShell`

### What works well
- 2-column hero at `lg:` breakpoint makes good use of wide screens.
- Provider grid (4 buttons) is a clear selection pattern.
- Destination mode segmented control (campground / recreation area) is self-labelling.
- Inline error message (`text-[var(--error)]`) renders red text directly below
  the submit button — clear enough.
- Form validation runs on submit before navigating.

### Issues

| ID | Issue | Priority |
|----|-------|----------|
| HP-1 | **`HomePage` uses `pt-14` (56 px) instead of `pt-[var(--topbar-h)]`.** Functionally equivalent today since `--topbar-h: 56px`. But if the token value ever changes, the homepage offset will be out of sync. Should be `pt-[var(--topbar-h)]` or wrapped in `PageShell`. | P3 |
| HP-2 | **`nights` field is redundant.** Nights are already fully determined by `startDate` and `endDate`. The field appears to exist to pass a value to the camply search payload but creates user confusion ("I set 3 nights but my dates are 2 nights apart"). Should be derived, not input. | P2 |
| HP-3 | **Provider button selected state is set via `!border-[var(--accent)]` (Tailwind `!important`).** This overrides the `border-[var(--border)]` base without a proper selected CSS class. Makes the selection hard to extend and inconsistent with other selection patterns. | P2 |
| HP-4 | **Error uses inline `text-[var(--error)]` style, not `.flash-error`.** The flash class provides background + border context that aids visibility. | P3 |
| HP-5 | **`nights` state is sent to the backend even when it conflicts with the date range.** No cross-validation is done before submission. | P2 |
| HP-6 | **No field-level validation feedback.** Required fields (provider, dates, destination) only show an error after the submit button is pressed. No inline cues (e.g., red border on the date input if departure ≤ arrival). | P3 |
| HP-7 | **App name (`VITE_APP_NAME`) defaults to `'Moondock'` — correct — but if the env var is cleared, the hero H1 disappears completely** (renders empty string, no fallback text). The code already handles this with `?? 'Moondock'` but should be verified in build output. | P3 |

### Recommended changes
1. Wrap the outermost `<div>` in `<PageShell width="wide">` or add a `pt-[var(--topbar-h)]` guard at the top of the page (HP-1).
2. Derive `nights` from `startDate`/`endDate` as a `useMemo`; remove the input field. Show the derived night count as read-only text next to the dates (HP-2, HP-5).
3. Replace inline `!border-[var(--accent)]` on selected provider button with a CSS class `.provider-btn-active` in `index.css` (HP-3).

---

## ResultsPage

**Route:** `/results` (page: `results`)
**File:** `pages/ResultsPage.tsx`
**Layout:** `<PageShell width="medium">`

### What works well
- Loading state is the best in the app — Spinner + polling status text + live progress messages.
- `SiteCard` grid transitions correctly from 1 → 2 → 3 columns.
- Filter bar shows only after results arrive (not during loading).
- Empty state for "no results" is friendly and clearly differentiated from "no search intent".

### Issues

| ID | Issue | Priority |
|----|-------|----------|
| RP-1 | **No result count shown.** After the search completes, users see N cards but no count summary ("12 available sites"). | P2 |
| RP-2 | **Filter bar is visible for every search, including single-provider results.** If all results have the same provider, the provider filter select offers only "All" + one option and adds visual noise. | P3 |
| RP-3 | **Filter bar is not sticky.** With many results the bar scrolls off-screen and users must scroll back to top to change filters. | P2 |
| RP-4 | **No sort control.** Results are shown in fetch order (match score descending). There is no way to re-sort by nights, date, or type. | P3 |
| RP-5 | **Min/max nights filters are open text inputs** — no validation prevents `minNights > maxNights`. No placeholder or unit label ("nights"). | P2 |
| RP-6 | **"Back to Search" link is missing.** If the search returned poor results, the only way back to HomePage is via the nav drawer. | P2 |
| RP-7 | **Tab chips (`.tab-chip`) are not used here.** The provider and site-type filters use `<select>` elements styled with the default input class. Tab chips would be more on-brand for a small set of known values (Tent / Auto / Group, All / Specific provider). | P3 |
| RP-8 | **Error state message is shown below the spinner** — if the page is long it might be off-screen. The error should be shown at the top inside a `.flash-error` block that persists after the spinner disappears. | P2 |

### Recommended changes
1. Add a results count line `"{N} available sites"` using `.section-label` above the filter bar (RP-1).
2. Add `position: sticky; top: var(--topbar-h); z-index: 10;` to the filter `content-card` (RP-3).
3. Add a "← New Search" ghost button in the page header (RP-6).
4. Replace `select` for Site Type filter with tab chips when option count ≤ 5 (RP-7 — optional, lower priority).

---

## HistoryPage

**Route:** `/history` (page: `history`)
**File:** `pages/HistoryPage.tsx`
**Layout:** `<PageShell width="medium">`

### What works well
- Tab chip filter (All / Planned / Booked / Completed) is the best use of that
  pattern in the app.
- Dismissible flash message for post-save feedback works correctly.
- `+ New Trip` button placement in the header is intuitive.
- Items sorted by date descending — correct default.

### Issues

| ID | Issue | Priority |
|----|-------|----------|
| HI-1 | **No loading state (XC-4/XC-5).** While the API call runs, the page renders an empty list with no spinner. First-time users see a blank page and may think the app is broken. | P1 |
| HI-2 | **Silent error on fetch failure (XC-6).** If `/api/trips` or `/api/outings` fails, the list stays empty with no message. | P1 |
| HI-3 | **No visual distinction between `trip` and `outing` items.** Both use `TripCard` identically. A user who has both types in their history cannot tell them apart. | P2 |
| HI-4 | **"View Log" is enabled on all trip-source cards** even when the trip has no associated outing entry. Clicking navigates to a pre-filled but empty LogPage. No cue to the user that there is nothing to see. | P2 |
| HI-5 | **Empty state text (`"No trips yet..."`) has no call-to-action.** A link or button to "Plan your first trip" or "Start a search" would reduce dead-end feeling. | P3 |
| HI-6 | **No pagination or virtual scroll.** A user with many trips will get a long single-page list. No known limit on the API response size. | P3 |

### Recommended changes
1. Show `<Spinner />` while `loading` is true; show `.flash-error` if the fetch throws (HI-1, HI-2).
2. Pass a `kind` prop to `TripCard` (source: `'trip'` or `'outing'`) and render a small type badge (HI-3).
3. Pass `hasLog={item.source === 'outing'}` to `TripCard` and disable "View Log" when false (HI-4).

---

## ReservePage

**Route:** `/reserve` (page: `reserve`)
**File:** `pages/ReservePage.tsx`
**Layout:** `<PageShell width="medium">`

### What works well
- 2-column layout at `lg:` breakpoint (Trip Details + Pre-trip Checklist) makes
  good use of wide screens.
- `ChecklistBuilder` in the right column is well placed.
- "Open Booking →" link correctly only renders when a booking URL exists.
- Flash success message on save is clearly styled.

### Issues

| ID | Issue | Priority |
|----|-------|----------|
| RE-1 | **No back/breadcrumb navigation (XC-3).** After arriving from ResultsPage via "Plan This Trip", there is no way back other than the nav drawer. The site card context is lost. | P2 |
| RE-2 | **Destination field toggle logic is opaque.** The form pre-fills `destination` from either `campgroundName` or `recAreaName` depending on the stored site. This logic is invisible to the user — they see a generic "Destination" input with no context about where the value came from. | P2 |
| RE-3 | **Status field default `'Planned'` is not communicated.** The select shows `Planned` on open — but only after the user interacts. Before interaction, the select renders blank (no default option selected visually). | P2 |
| RE-4 | **No validation summary.** Required fields (title, destination, dates) are not marked required in the UI. The save handler likely allows saving empty forms. | P2 |
| RE-5 | **Notes textarea does not span the full form width on mobile.** It is placed inside the `lg:grid-cols-2` layout which collapses to stacked on mobile — correct — but the textarea has a fixed height that truncates long entries on small screens. | P3 |
| RE-6 | **`ChecklistBuilder` "Add item" button uses hardcoded Tailwind styling** instead of `.btn .btn-primary` (CL-1). Inconsistent appearance. | P2 |
| RE-7 | **No Enter-key support on the checklist input** (CL-2). User must click "Add item" every time. | P2 |

### Recommended changes
1. Add `← Back to Results` ghost button in page header; store a back-nav hint in session storage when navigating from ResultsPage → ReservePage (RE-1).
2. Show the source context (campground name, provider) as read-only metadata at the top of the form (RE-2).
3. Add a `defaultValue="Planned"` to the status `<select>` and validate required fields before saving (RE-3, RE-4).
4. Fix `ChecklistBuilder` button class (CL-1) and add Enter key handler (CL-2) — both are in the component, not this page.

---

## LogPage

**Route:** `/log` (page: `log`)
**File:** `pages/LogPage.tsx`
**Layout:** `<PageShell width="medium">`

### What works well
- Single-card layout keeps all journal fields grouped and focused.
- 2-col grid for Hikes and Meals is a good use of horizontal space at `sm:`.
- Recent entries section below the form gives good context.
- Photo upload with preview list is functional.
- "← History" ghost button provides clear back navigation (best back-nav in
  the app).

### Issues

| ID | Issue | Priority |
|----|-------|----------|
| LG-1 | **Photo upload error uses `text-red-500`** (hardcoded Tailwind) instead of the design system token. Should use `text-[var(--error)]` or a `.flash-error` block. This is the only place in the UI where a raw Tailwind colour name (`red-500`) is used for a semantic state. | P1 |
| LG-2 | **No loading state for recent entries (XC-4/XC-5).** The section starts blank while the API call runs. No spinner or skeleton. | P1 |
| LG-3 | **Silent error on failed entries fetch (XC-6).** If `/api/outings` fails, the recent entries section stays blank. | P1 |
| LG-4 | **Save feedback (`message` state) is rendered at the bottom of the single content-card**, below the save button — users on long forms may not see the confirmation without scrolling. | P2 |
| LG-5 | **Photos are displayed as a plain text list** (filename + delete link). No thumbnail preview — files are uploaded but the preview shows the filename only, not an image. | P2 |
| LG-6 | **No way to edit or delete a recent entry from this page.** Entries in the recent section are read-only. The only edit path is through HistoryPage. | P3 |
| LG-7 | **Navigating directly to `/log` without a `LOG_CONTEXT_KEY` in storage** (e.g. from nav drawer) leaves all fields empty. The user can write a free-form journal entry but the date, location, and title fields are blank with no prompt. | P2 |

### Recommended changes
1. Replace `text-red-500` with `text-[var(--error)]` on the upload error paragraph (LG-1 — 1-line fix).
2. Show `<Spinner />` while loading recent entries; show `.flash-error` on fetch failure (LG-2, LG-3).
3. Move the `message` flash block to the top of the `content-card` (above the form fields), or use a toast/overlay approach so it's always visible (LG-4).
4. When `LOG_CONTEXT_KEY` is missing, pre-fill `date` with today's date and show a `.section-label`-styled hint: "New journal entry — fill in the details below" (LG-7).

---

## Summary scorecard

| Page | P1 issues | P2 issues | P3 issues |
|------|-----------|-----------|-----------|
| HomePage | 0 | 4 | 3 |
| ResultsPage | 0 | 4 | 4 |
| HistoryPage | 2 | 3 | 1 |
| ReservePage | 0 | 5 | 1 |
| LogPage | 3 | 3 | 1 |
| Cross-cutting | 2 | 2 | 2 |
| **Total** | **7** | **21** | **12** |

### P1 issues — fix these first

1. **XC-4 / XC-5** — No loading spinner on HistoryPage and LogPage
2. **XC-6** — Silent API error on HistoryPage and LogPage
3. **HI-1** — HistoryPage blank during loading
4. **HI-2** — HistoryPage silent on API error
5. **LG-1** — LogPage upload error uses `text-red-500` (wrong token)
6. **LG-2** — LogPage recent entries blank during loading
7. **LG-3** — LogPage silent on entries fetch error
