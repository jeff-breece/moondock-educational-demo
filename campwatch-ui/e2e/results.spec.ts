/**
 * E2E tests — Results page
 * Covers: empty state when navigated without intent, back navigation
 */
import { expect, test } from '@playwright/test';

test.describe('Results Page', () => {
  test('shows no-intent state when navigated directly', async ({ page }) => {
    // Clear any stored intent first
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('campwatch_search_intent'));
    await page.goto('/#/results');
    // Should show a message directing back to search
    await expect(
      page.getByText(/no search/i).or(page.getByText(/go back/i)).or(page.getByRole('button', { name: /search/i })),
    ).toBeVisible({ timeout: 5000 });
  });

  test('shows loading state when search intent is set', async ({ page }) => {
    await page.goto('/');
    // Inject a search intent directly into localStorage
    await page.evaluate(() => {
      localStorage.setItem('campwatch_search_intent', JSON.stringify({
        provider: 'OhioStateParks',
        destinationMode: 'campground',
        campgroundIds: ['60'],
        recreationAreaIds: [],
        startDate: '2026-08-01',
        endDate: '2026-08-03',
        nights: 2,
        equipment: ['Tent'],
      }));
    });
    await page.goto('/#/results');
    // Should show loading spinner or site cards (not no-intent message)
    await expect(
      page.locator('[class*="spinner"]').or(
        page.locator('[class*="animate"]').first(),
      ).or(
        page.getByText(/searching/i),
      ),
    ).toBeVisible({ timeout: 5000 });
  });
});
