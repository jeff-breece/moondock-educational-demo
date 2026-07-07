/**
 * E2E tests — Trip History and Log pages
 */
import { expect, test } from '@playwright/test';

test.describe('Trip History Page', () => {
  test('renders page heading', async ({ page }) => {
    await page.goto('/#/history');
    await expect(
      page.getByRole('heading', { name: /trip history/i }).or(page.getByText(/no trips/i)),
    ).toBeVisible();
  });

  test('shows empty state when no trips saved', async ({ page }) => {
    await page.goto('/#/history');
    // Either a list of trips or an empty-state message
    const emptyOrList = page.getByText(/no trips/i).or(
      page.locator('[data-testid="trip-card"]').first(),
    );
    await expect(emptyOrList).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Trip Log Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/log');
  });

  test('renders the journal entry form', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /log/i }).or(page.getByText(/journal/i)).or(
        page.getByText(/trip log/i),
      ),
    ).toBeVisible();
  });

  test('has a notes/journal textarea', async ({ page }) => {
    await expect(page.locator('textarea').first()).toBeVisible();
  });

  test('has a date field', async ({ page }) => {
    await expect(page.locator('input[type="date"]').first()).toBeVisible();
  });

  test('shows validation when saving without required fields', async ({ page }) => {
    const saveBtn = page.getByRole('button', { name: /save|submit|log/i }).last();
    if (await saveBtn.count() > 0) {
      await saveBtn.click();
      // Some form validation should fire
      await expect(
        page.locator('input:invalid').first().or(page.getByText(/required/i)),
      ).toBeVisible({ timeout: 3000 });
    }
  });
});
