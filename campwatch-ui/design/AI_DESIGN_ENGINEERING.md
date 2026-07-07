# AI-Assisted Design Engineering — Field Guide

A practitioner's guide to using AI coding agents as a design-engineering partner,
illustrated by the complete Moondock UI refactoring session.

---

## Contents

1. [Philosophy](#1-philosophy)
2. [The design artifact system](#2-the-design-artifact-system)
3. [The feedback loop in practice](#3-the-feedback-loop-in-practice)
4. [Writing effective prompts](#4-writing-effective-prompts)
5. [Testing strategy](#5-testing-strategy)
6. [Playwright — layout & visual verification](#6-playwright--layout--visual-verification)
7. [Vitest — unit & behaviour guards](#7-vitest--unit--behaviour-guards)
8. [Full session reconstruction](#8-full-session-reconstruction)
9. [Checklists](#9-checklists)

---

## 1. Philosophy

Treating an AI agent as a "code autocomplete on steroids" loses most of the value.
The leverage comes from treating it as a **design-engineering co-pilot** that can:

- Hold the full codebase context you can't keep in your head simultaneously
- Translate UX intent (screenshots, spec prose) into precise CSS/TSX edits
- Reason about CSS cascade, flex layout, and optical perception with you
- Run builds and tests immediately so regressions surface before commit

The human's job changes from *writing code* to **writing decisions** — precise,
well-reasoned prompts that capture the *why* as clearly as the *what*.

> **Rule of thumb:** the quality of the output is bounded by the quality of the
> input. A vague prompt produces a locally-correct but globally-incoherent diff.
> A prompt with a spec reference, a root-cause hypothesis, and a clear expected
> outcome produces a surgical, reviewable change.

---

## 2. The design artifact system

Before any code change was made, five design documents were created in this folder.
They serve as the **shared mental model** between you and the AI agent across a
multi-session refactoring.

| File | Purpose |
|---|---|
| `STYLE_GUIDE.md` | CSS custom properties, typography scale, spacing, color system, shadows, breakpoints |
| `COMPONENT_LIBRARY.md` | Every reusable component: props, usage, variants, known issues |
| `PAGE_AUDIT.md` | Per-page UX audit — P1 bugs, P2 improvements, P3 polish; severity-ranked |
| `LAYOUT_SPEC.md` | Responsive layout system: topbar, nav drawer, PageShell, page-specific patterns, z-index stack |
| `README.md` | Index, approval gate, how to use these docs |

### Why artifact-first?

Without a shared spec:
- Each prompt re-explains context the agent already knew
- "Fix the layout" produces local fixes that break global consistency
- You can't tell the agent *which part* of a screenshot deviates from intent

With a shared spec:
- Prompts can say "violates §3 of LAYOUT_SPEC" — the agent already holds the spec
- Deviations are identified by name ("optical centre", "2:3 spacer ratio")
- Every fix is traceable to a spec section, making review straightforward

### Keeping the artifacts current

Update the relevant doc **in the same commit** as any structural code change:

```
# When adding a new component
→ add entry to COMPONENT_LIBRARY.md

# When changing the layout system
→ update LAYOUT_SPEC.md §3 (PageShell) or the relevant section

# When a P1 audit finding is resolved
→ mark it resolved in PAGE_AUDIT.md, note the commit hash
```

---

## 3. The feedback loop in practice

This session used a five-step loop. Each iteration tightened the design fidelity.

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  1. SCREENSHOT                                              │
│     Capture the rendered page at the target viewport.       │
│     Use DevTools device emulation for consistent framing.   │
│                                                             │
│  2. COMPARE                                                 │
│     Annotate every deviation from the spec. Reference the   │
│     exact spec section. State observed vs. expected.        │
│                                                             │
│  3. PROMPT                                                  │
│     Send the annotated deviation list as a structured       │
│     prompt (see §4). Include a root-cause hypothesis.       │
│                                                             │
│  4. IMPLEMENT + TEST                                        │
│     Agent edits files, runs build + tests, verifies 200 OK. │
│     Review the diff before accepting.                       │
│                                                             │
│  5. DEPLOY + RE-SCREENSHOT                                  │
│     Rebuild the container, load the live app, repeat.       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Real iterations from this session

| Round | Issue identified | Root cause | Fix |
|---|---|---|---|
| 1 | LogPage `← History` below title; HistoryPage `+ New Trip` misaligned; TopBar spec mismatch | DOM order error; relative+absolute positioning gap | Reorder elements; `absolute right-0` on button |
| 2 | Content top-aligned instead of vertically centred | `min-height` on flex container does not create a definite height for `my-auto` | Replace `my-auto` + `flex-1` with `justify-center` on inner flex column |
| 3 | `justify-center` produces mathematical centre, feels top-heavy | Optical centre ≠ geometric centre | 2:3 flex spacers (`flex-[2]` above, `flex-[3]` below) |
| 4 | Content left-aligned on all inner pages | `mx-auto` absorbed by `align-items: stretch` before it can distribute horizontal space | `items-center` on outer flex column; explicit `width: 100%` on `.page-root`; `w-full` on `<main>` |
| 5 | HistoryPage should top-align (list pattern) | Optical centering wrong for browse/list pages | `align="top"` prop on `PageShell`; only HistoryPage opts out |

---

## 4. Writing effective prompts

### The anatomy of a high-quality design-fix prompt

```
## Context
Which page(s). Which spec section is violated.

## Observed behaviour
What the screenshot shows. Quantify where possible
("content occupies ~35% of viewport width").

## Expected behaviour per spec
Quote or paraphrase the relevant spec section.

## Root cause hypothesis
Your best guess at the CSS/DOM cause. Even a wrong hypothesis
focuses the agent's investigation productively.

## Fix to investigate
Specific files, properties, and approaches to try.
List multiple options if the root cause is uncertain.

## Cross-checks
Other pages / states to verify the fix doesn't regress.
```

### Examples from this session

**Too vague (don't do this):**
> "The page layout looks off, can you fix it?"

**Good (specific, spec-referenced, hypothesised):**
> "On all four `PageShell` pages the content is left-aligned. Per
> LAYOUT_SPEC §3 the `max-w-5xl` column should be horizontally centred.
> Root cause: `mx-auto` on a flex item is absorbed by `align-items: stretch`
> before it can distribute horizontal free space. Fix by switching to
> `items-center` on the outer flex column, mirroring the `HomePage` pattern.
> Cross-check: verify `ResultsPage` sticky filter bar isn't broken."

### Optical-perception prompts

When the issue is perceptual rather than structural, describe the *human
experience* first, then provide the geometric model:

> "The content feels top-heavy even though it's mathematically centred.
> The human eye reads a block as centred when it's ~10–15% above the geometric
> midpoint. Use a 2:3 flex spacer ratio (2 parts above, 3 below) to place
> content at the optical centre (~40% from top)."

This two-part structure — subjective observation + geometric reasoning — lets
the agent implement a principled solution rather than guessing at a pixel offset.

---

## 5. Testing strategy

Two complementary layers are in place:

```
┌─────────────────────────────────────────────────────┐
│  LAYER 2 — Playwright E2E                           │
│  Full browser, real HTTP, two viewports             │
│  Verifies: navigation flows, layout presence,       │
│  responsive behaviour, visual regression anchors    │
├─────────────────────────────────────────────────────┤
│  LAYER 1 — Vitest + React Testing Library           │
│  jsdom, component-isolated, fast (< 10s full suite) │
│  Verifies: render correctness, user interactions,   │
│  API integration, state management                  │
└─────────────────────────────────────────────────────┘
```

### When to run each

| Scenario | Command | When |
|---|---|---|
| Quick unit check after a component edit | `npm test -- --run` | Every code change |
| Watch mode during active development | `npm test` (vitest watch) | Long sessions |
| Full E2E against the live container | `npm run test:e2e` | Before commit of layout/nav changes |
| E2E with Playwright UI inspector | `npm run test:e2e:ui` | Debugging a failing E2E spec |
| Coverage report | `npm run test:coverage` | Before PR / milestone |

### Coverage philosophy

Unit tests cover **logic and state**. Playwright covers **layout and flow**.
Don't duplicate: don't write a Playwright test for a button-click side-effect
that's already covered in Vitest, and don't write a Vitest test for "the topbar
has the correct text" when Playwright catches that in the navigation spec.

---

## 6. Playwright — layout & visual verification

### Project structure

```
campwatch-ui/
├── e2e/
│   ├── navigation.spec.ts    ← hamburger, all 5 nav items, URL routing
│   ├── search.spec.ts        ← HomePage form: provider, picker, dates, submit
│   ├── results.spec.ts       ← ResultsPage: card grid, filters, site detail
│   ├── reserve.spec.ts       ← ReservePage: form, checklist, save flow
│   └── history-log.spec.ts   ← HistoryPage + LogPage: list, new trip, journal
├── playwright.config.ts
```

Two projects run in parallel: `Desktop Chrome` and `iPhone 13 (mobile)`.
Screenshots and traces are retained on failure.

### Config

```ts
// playwright.config.ts — key settings
const BASE_URL = process.env.BASE_URL ?? 'https://campwatch.lab';

use: {
  baseURL: BASE_URL,
  ignoreHTTPSErrors: true,   // self-signed *.lab cert
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
  trace: 'retain-on-failure',
}
```

Run against the local Docker container:

```bash
BASE_URL=http://10.0.100.10:3001 npm run test:e2e
```

### Writing layout-verification tests

Layout bugs are best caught by asserting **structural presence** and
**approximate bounding-box geometry**, not pixel-perfect screenshots.

```ts
// ✅ Good — checks the centred column is present and wide enough
test('PageShell column is centred and fills medium width', async ({ page }) => {
  await page.goto('/#/history');
  const column = page.locator('.max-w-5xl').first();
  const box = await column.boundingBox();
  const viewport = page.viewportSize()!;

  // Column should be visible
  await expect(column).toBeVisible();

  // On desktop, column should be close to 1024px wide (max-w-5xl = 64rem)
  if (viewport.width >= 1024) {
    expect(box!.width).toBeGreaterThan(900);
  }

  // Column left edge should not be flush with viewport left (i.e. it's centred)
  if (viewport.width >= 1024) {
    expect(box!.x).toBeGreaterThan(50);
  }
});

// ✅ Good — verifies topbar is fixed and correct height
test('topbar is fixed and 56px tall', async ({ page }) => {
  await page.goto('/');
  const topbar = page.locator('.topbar');
  const box = await topbar.boundingBox();
  expect(box!.y).toBe(0);              // fixed at top
  expect(box!.height).toBeCloseTo(56, 0);
});

// ✅ Good — verifies HistoryPage content starts near the top (align="top")
test('HistoryPage content is top-aligned not centred', async ({ page }) => {
  await page.goto('/#/history');
  const heading = page.getByRole('heading', { name: /my trips/i });
  const box = await heading.boundingBox();
  const viewport = page.viewportSize()!;
  // Heading should be in the upper 40% of the viewport (top-aligned, not centred)
  expect(box!.y).toBeLessThan(viewport.height * 0.4);
});

// ✅ Good — verifies optical-centred pages place content above midpoint
test('ReservePage content sits above vertical midpoint (optical centre)', async ({ page }) => {
  await page.goto('/#/reserve');
  const heading = page.getByRole('heading', { name: /plan a trip/i });
  await expect(heading).toBeVisible();
  const box = await heading.boundingBox();
  const viewport = page.viewportSize()!;
  const topbarH = 56;
  const available = viewport.height - topbarH;
  // Content should start in the upper half of available space
  expect(box!.y - topbarH).toBeLessThan(available * 0.55);
});
```

### Responsive testing — mobile vs desktop

Playwright runs both `Desktop Chrome` (1280×720) and `iPhone 13` (390×844)
in the same test run. Write one spec and let the viewport drive the assertions:

```ts
test('nav drawer closes on mobile after navigation', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /open navigation/i }).click();
  await page.getByRole('button', { name: 'Trip History' }).click();
  // Drawer should auto-close after navigating
  await expect(page.getByRole('complementary')).not.toBeVisible();
  await expect(page).toHaveURL(/#\/history/);
});
```

### Debugging failures

When a Playwright test fails:
1. `npm run test:e2e:ui` — opens the Playwright UI inspector with time-travel
2. Check `playwright-report/` for the auto-generated HTML report
3. Screenshots and traces are in `test-results/` on failure

---

## 7. Vitest — unit & behaviour guards

### Philosophy

Every component that involves:
- an API call (fetch mock)
- user interaction (click, type, submit)
- conditional rendering (loading, error, empty state)

…should have a Vitest spec. These run in under 10 seconds total and catch
regressions that don't need a live browser.

### Key patterns from this codebase

```ts
// Mock fetch globally (see src/__tests__/setup.ts)
vi.mock('global.fetch');

// Helper: wrap API response in a proper Response object
import { mockJsonResponse } from './testUtils';
vi.mocked(fetch).mockResolvedValueOnce(mockJsonResponse([]));

// Simulate user events (prefer userEvent over fireEvent)
import userEvent from '@testing-library/user-event';
const user = userEvent.setup();
await user.click(screen.getByRole('button', { name: /add item/i }));
await user.type(screen.getByPlaceholderText(/item/i), 'Tent stakes');

// Date input: always clear before typing (jsdom appends to existing value)
await user.clear(screen.getByLabelText(/date/i));
await user.type(screen.getByLabelText(/date/i), '2026-07-15');

// Wait for async state updates
await waitFor(() => expect(screen.getByText(/hocking hills/i)).toBeInTheDocument());
```

### Guard new layout work with smoke tests

After a layout change, add or update one test that fails if the key
structural element is missing:

```ts
// After adding align="top" to PageShell — guard against regression
it('renders HistoryPage without the optical-centre spacers', () => {
  render(<HistoryPage onNavigate={vi.fn()} />);
  // The page should render without error; no spacer divs should trap focus
  expect(screen.queryByRole('presentation')).toBeNull(); // no hidden spacers
});
```

---

## 8. Full session reconstruction

This section is a condensed log of every structural decision made during the
Moondock refactoring, in chronological order. Use it as a reference when
applying the same workflow to a new feature.

### Step 1 — Read the code before writing anything

Before any prompt was sent, every page file, every component, `index.css`,
`PageShell.tsx`, `TopBar.tsx`, and `HamburgerNav.tsx` were read in parallel.
This surface area maps to exactly what could be affected by a layout-system
change. Reading first prevented "fix one thing, break another" surprises.

### Step 2 — Create design artifacts (approval gate)

Five documents were written into `design/` as a single commit before any
code was touched. The user reviewed and approved. This created a shared
vocabulary for the rest of the session.

### Step 3 — Metro icon swap

**Change:** `index.html` + `TopBar.tsx` + `HamburgerNav.tsx`  
**Why Metro icons:** visual consistency with a modern icon font vs. emoji,
whose rendering varies across OS and font stacks.  
**Learning:** Metro v4 uses CSS pseudo-elements (`::before`) on `display: inline-block`
spans. The icon character is injected via `:before { content: "\e..." }`.
This means `<span class="mif-search" />` (self-closing) renders correctly
because the content is generated, not innerHTML.

### Step 4 — P1/P2 audit fixes

Nine issues from `PAGE_AUDIT.md` were fixed in one commit:
- `LogPage`: `← History` moved above the header block (DOM order, not CSS)
- `HistoryPage`: `+ New Trip` made `absolute right-0` within a `relative` header
  wrapper so the heading stays truly centred
- `ResultsPage`: sticky filter bar with `rounded-b-[1rem]` (flat top) and `z-10`
- `ReservePage`: `← Back to Results` ghost button; source context strip

### Step 5 — Vertical centering (three iterations)

**Attempt 1 — `justify-center`:** Replaced `my-auto` + `flex-1`. Works because
`min-height` on the inner flex container creates a definite height that
`justify-center` can distribute space against. But produces 50/50 split which
feels top-heavy.

**Attempt 2 — 2:3 flex spacers:** Two `aria-hidden` spacer divs with
`flex-[2]` and `flex-[3]`. These have `flex-basis: 0` and grow proportionally
into the free space when the content is shorter than the container. When content
is taller than `min-height`, free space = 0, spacers collapse, page scrolls
naturally. **This is the correct general solution for optical centering in CSS flex.**

```tsx
// PageShell.tsx — optical centre spacers
<div className="flex-[2]" aria-hidden="true" />   {/* 40% of free space above */}
<div className="w-full py-8">{children}</div>
<div className="flex-[3]" aria-hidden="true" />   {/* 60% of free space below */}
```

### Step 6 — Horizontal centering

**Root cause analysis:** `mx-auto` on a flex item distributes free space *after*
`align-items: stretch` has already sized the item to 100% of the container —
leaving nothing to distribute. Switching to `items-center` on the outer flex
column delegates centering to the container's alignment algorithm, which
correctly handles `width: 100%; max-width: 1024px`.

**The fix:**
```tsx
// Before — mx-auto on child doesn't work reliably in flex-col
<div className="page-root flex flex-col">
  <div className="mx-auto flex w-full flex-col max-w-5xl ...">

// After — items-center on container, explicit w-full on ancestors
<div className="page-root flex w-full flex-col items-center">
  <div className="flex w-full flex-col max-w-5xl ...">
```

**Also required:** `width: 100%` on `.page-root` in `index.css` and
`w-full` on `<main>` in `App.tsx` — closes the ancestor width chain.

### Step 7 — HistoryPage top-alignment

A list/browse page should be top-aligned, not vertically centred. Pattern:
an `align` prop on `PageShell` that conditionally renders the spacers.

```tsx
// Only opt out pages that are browse/list patterns
<PageShell width="medium" align="top">   // HistoryPage
<PageShell width="medium">               // all other inner pages (default: 'optical')
```

---

## 9. Checklists

### Before starting a design-fix session

- [ ] All five design docs exist in `design/` and are current
- [ ] Screenshots are captured at a consistent viewport (e.g. 1280×720 Desktop Chrome)
- [ ] Each screenshot is annotated with the spec section it violates
- [ ] You have a root-cause hypothesis (even a tentative one) for each issue

### After every structural code change

- [ ] `npm run build` — clean TypeScript compile + Vite bundle
- [ ] `npm test -- --run` — 40 unit tests passing
- [ ] `npm run test:e2e` — E2E suite green (or known-failing spec updated)
- [ ] Diff reviewed: no unintended side-effects on other pages
- [ ] LAYOUT_SPEC.md or COMPONENT_LIBRARY.md updated if the change is structural
- [ ] Commit message explains *why*, not just *what*

### Before deploying to lab-stt

```bash
# From Pangolin
make test && make smoke-test

# Then deploy
git push
ssh jeff@10.0.100.10 "cd ~/resonance-lab && git pull --rebase --autostash"
ssh jeff@10.0.100.10 "cd ~/resonance-lab/campwatch && docker compose build campwatch-ui && docker compose up -d campwatch-ui"

# Verify
curl -I http://10.0.100.10:3001/   # expect 200 OK
```

### When a layout fix "obviously works" but screenshots look wrong

1. Hard refresh in the browser (`Ctrl+Shift+R`) — nginx caches aggressively
2. Check the container actually rebuilt: `docker ps` should show a recent `Started` time
3. Inspect the element in DevTools — measure actual pixel widths and confirm computed styles
4. Add a temporary Playwright test with `boundingBox()` assertions to confirm geometry

---

*Last updated: 2026-07-07 — reflects the complete Moondock UX refactoring session.*
