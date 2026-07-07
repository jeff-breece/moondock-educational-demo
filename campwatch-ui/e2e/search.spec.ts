/**
 * E2E tests — Home page search form
 * Covers: provider selection, dependent picker activation, form validation,
 *         date entry, search submission → navigate to results
 */
import { expect, test } from '@playwright/test';

test.describe('Home Page Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders hero headline', async ({ page }) => {
    await expect(page.getByText('Moondock')).toBeVisible();
    await expect(page.getByText(/find your next wilderness campsite/i)).toBeVisible();
  });

  test('campground picker is disabled before provider selection', async ({ page }) => {
    // Without a provider, the picker shows "Select a provider first" hint button
    await expect(page.getByText(/select a provider first/i)).toBeVisible();
  });

  test('selecting a provider enables the campground picker', async ({ page }) => {
    await page.getByRole('button', { name: 'Ohio State Parks' }).click();
    // Picker input or browse button should appear
    const picker = page.locator('input[placeholder*="campground"]').or(
      page.getByRole('button', { name: /browse/i }),
    );
    await expect(picker.first()).toBeVisible({ timeout: 8000 });
  });

  test('campground picker loads options for Ohio State Parks', async ({ page }) => {
    await page.getByRole('button', { name: 'Ohio State Parks' }).click();
    // Wait for seed data to load and "Browse N options" button to appear
    const browseBtn = page.getByRole('button', { name: /browse \d+ options/i });
    await expect(browseBtn).toBeVisible({ timeout: 10000 });
  });

  test('can open picker dropdown and select a campground', async ({ page }) => {
    await page.getByRole('button', { name: 'Ohio State Parks' }).click();
    const browseBtn = page.getByRole('button', { name: /browse \d+ options/i });
    await browseBtn.waitFor({ state: 'visible', timeout: 10000 });
    await browseBtn.click();
    // Dropdown should show campground items
    const firstItem = page.locator('[role="button"]').filter({ hasText: /campground/i }).first();
    await expect(firstItem).toBeVisible({ timeout: 5000 });
    await firstItem.click();
    // Selected campground appears as a pill tag
    await expect(page.locator('.inline-flex').first()).toBeVisible();
  });

  test('shows validation error when submitting without a provider', async ({ page }) => {
    await page.getByRole('button', { name: 'Find Campsites' }).click();
    await expect(page.getByText(/choose a provider before searching/i)).toBeVisible();
  });

  test('shows validation error when submitting without dates', async ({ page }) => {
    await page.getByRole('button', { name: 'Ohio State Parks' }).click();
    await page.getByRole('button', { name: 'Find Campsites' }).click();
    await expect(
      page.getByText(/add arrival and departure dates/i).or(
        page.getByText(/pick a campground/i),
      ),
    ).toBeVisible();
  });

  test('switches to recreation area mode', async ({ page }) => {
    await page.getByRole('button', { name: 'Ohio State Parks' }).click();
    await page.getByRole('button', { name: /browse a recreation area/i }).click();
    await expect(page.getByText(/recreation area/i).first()).toBeVisible();
  });
});
