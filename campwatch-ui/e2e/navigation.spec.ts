/**
 * E2E tests — Navigation
 * Covers: hamburger open/close, all 5 nav items navigate correctly
 */
import { expect, test } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('hamburger button is visible and labeled', async ({ page }) => {
    const btn = page.getByRole('button', { name: /open navigation/i });
    await expect(btn).toBeVisible();
  });

  test('hamburger opens the nav drawer', async ({ page }) => {
    await page.getByRole('button', { name: /open navigation/i }).click();
    await expect(page.getByRole('complementary')).toBeVisible(); // <aside>
    await expect(page.getByText('Trip History')).toBeVisible();
    await expect(page.getByText('Plan a Trip')).toBeVisible();
    await expect(page.getByText('Trip Log')).toBeVisible();
  });

  test('clicking overlay closes the nav drawer', async ({ page }) => {
    await page.getByRole('button', { name: /open navigation/i }).click();
    await page.getByLabel('Close navigation overlay').click();
    await expect(page.getByRole('complementary')).not.toBeVisible();
  });

  test('navigates to Trip History page', async ({ page }) => {
    await page.getByRole('button', { name: /open navigation/i }).click();
    await page.getByRole('button', { name: 'Trip History' }).click();
    await expect(page).toHaveURL(/#\/history/);
    await expect(page.getByRole('heading', { name: /trip history/i })).toBeVisible();
  });

  test('navigates to Plan a Trip page', async ({ page }) => {
    await page.getByRole('button', { name: /open navigation/i }).click();
    await page.getByRole('button', { name: 'Plan a Trip' }).click();
    await expect(page).toHaveURL(/#\/reserve/);
  });

  test('navigates to Trip Log page', async ({ page }) => {
    await page.getByRole('button', { name: /open navigation/i }).click();
    await page.getByRole('button', { name: 'Trip Log' }).click();
    await expect(page).toHaveURL(/#\/log/);
  });

  test('navigates back to Home page', async ({ page }) => {
    await page.goto('/#/history');
    await page.getByRole('button', { name: /open navigation/i }).click();
    await page.getByRole('button', { name: 'Home' }).click();
    await expect(page).toHaveURL(/#\/$/);
  });
});
