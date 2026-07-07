# Moondock UI — Design Folder

**Purpose:** UX review artifact. After approval, an agent will use these
documents to apply targeted fixes to the existing UI source files. No changes
should be made to `src/` until this folder has been reviewed and signed off.

**Scope:** All five feature pages of the Moondock campsite-search app, the
shared component set, and the layout shell.

---

## Files in this folder

| File | Contents |
|------|----------|
| `STYLE_GUIDE.md` | Design tokens, color system, typography scale, spacing, shadows, breakpoints |
| `COMPONENT_LIBRARY.md` | Every reusable component — props, usage, current issues, recommended fixes |
| `PAGE_AUDIT.md` | Per-page UX audit with prioritised issue list and recommended changes |
| `LAYOUT_SPEC.md` | Responsive layout system — PageShell, TopBar, nav drawer, page-header pattern, grid conventions |
| `AI_DESIGN_ENGINEERING.md` | Field guide: how to use AI as a design-engineering partner, illustrated by this refactoring session — includes Playwright + Vitest testing strategy |

---

## Source references

All source files are under `campwatch/campwatch-ui/src/`.

| Source file | Role |
|-------------|------|
| `index.css` | Global design tokens + utility classes |
| `components/PageShell.tsx` | Layout wrapper |
| `components/TopBar.tsx` | Fixed top bar |
| `components/HamburgerNav.tsx` | Slide-out nav drawer |
| `components/SiteCard.tsx` | Campsite result card |
| `components/TripCard.tsx` | Trip history row card |
| `components/ChecklistBuilder.tsx` | Interactive prep checklist |
| `components/CamplyPicker.tsx` | Combobox with seed + live search |
| `components/Spinner.tsx` | Loading spinner |
| `components/AppBackground.tsx` | Full-page background layer |
| `pages/HomePage.tsx` | Search entry form (route: `home`) |
| `pages/ResultsPage.tsx` | Search results + filters (route: `results`) |
| `pages/HistoryPage.tsx` | Trip history list (route: `history`) |
| `pages/ReservePage.tsx` | Trip plan form + checklist (route: `reserve`) |
| `pages/LogPage.tsx` | Field journal + photo upload (route: `log`) |

---

## Workflow

1. **Read** all four design documents.
2. **Review** the prioritised issue list in `PAGE_AUDIT.md` (P1 → P2 → P3).
3. **Approve or amend** — mark items to accept, defer, or reject.
4. **Agent applies fixes** — one logical change per commit, referencing the
   issue ID from `PAGE_AUDIT.md` (e.g. `fix(ui): HP-3 align error messaging`).
5. **Re-test** with `npm test` + manual smoke-test on each page.

---

## Design principles (guiding the audit)

1. **Forest-forward, not feature-heavy.** The visual language is intentional —
   dark greens, warm gold accents, minimal chrome. Fixes should preserve this.
2. **Consistency over cleverness.** Every page should use the same page-header
   pattern, the same error/flash pattern, the same back-navigation pattern.
3. **Class over inline.** The CSS utility classes in `index.css` exist to be
   used. Inline Tailwind overrides are acceptable for layout; they should not
   duplicate what a named class already provides.
4. **Mobile first.** The app is used in the field. Every page must be fully
   usable at 375 px wide before optimising for desktop.
5. **Accessible.** Semantic HTML, `aria-label` on icon-only controls, visible
   focus rings, no colour-only signals.
