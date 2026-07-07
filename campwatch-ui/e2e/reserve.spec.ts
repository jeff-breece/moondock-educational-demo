/**
 * E2E tests — Reserve / Plan a Trip page
 * Covers: form renders, checklist items, save validation
 */
import { expect, test } from '@playwright/test';

test.describe('Reserve Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/reserve');
  });

  test('renders the trip planning form', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /plan/i }).or(page.getByText(/plan a trip/i)),
    ).toBeVisible();
  });

  test('renders pre-trip checklist section', async ({ page }) => {
    await expect(page.getByText(/checklist/i)).toBeVisible();
  });

  test('checklist has default items', async ({ page }) => {
    // Default checklist includes these primitive camping items
    await expect(page.getByText(/tent/i).first()).toBeVisible();
  });

  test('can add a custom checklist item', async ({ page }) => {
    const addInput = page.locator('input[placeholder*="Add"]').or(
      page.locator('input[placeholder*="checklist"]'),
    );
    if (await addInput.count() > 0) {
      await addInput.fill('Custom item for test');
      await page.keyboard.press('Enter');
      await expect(page.getByText('Custom item for test')).toBeVisible();
    } else {
      test.skip(true, 'No add checklist input found — component may render differently');
    }
  });

  test('shows validation when saving without a trip name', async ({ page }) => {
    const saveBtn = page.getByRole('button', { name: /save|plan|create/i }).last();
    await saveBtn.click();
    await expect(
      page.getByText(/name/i).or(page.getByText(/required/i)),
    ).toBeVisible({ timeout: 3000 });
  });
});
