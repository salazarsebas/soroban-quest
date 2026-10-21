import { expect, test, type Page } from '@playwright/test';
import { clearLocalStorageBeforePageLoad } from './utils';

const pathNodes = '.learning-path-desktop .path-node';

async function openMissionMap(page: Page, completedMissions: string[]) {
  await clearLocalStorageBeforePageLoad(page);
  await page.evaluate((completed) => {
    localStorage.setItem(
      'soroban_quest_progress',
      JSON.stringify({ completedMissions: completed }),
    );
  }, completedMissions);

  await page.goto('/#/missions');
  await page.waitForLoadState('networkidle');
  await expect(page.locator(pathNodes).first()).toBeVisible();
}

test.describe('Mission map desktop path', () => {
  test('search updates the path nodes', async ({ page }) => {
    await openMissionMap(page, []);
    const totalNodes = await page.locator(pathNodes).count();
    expect(totalNodes).toBeGreaterThan(3);

    await page.locator('.search-input').fill('storage');
    await expect(page.locator(pathNodes)).not.toHaveCount(totalNodes);
    // The path shows the same filtered set as the (fully mounted) card grid.
    const cardCount = await page.locator('.mission-card[data-mission-id]').count();
    expect(cardCount).toBeGreaterThan(0);
    await expect(page.locator(pathNodes)).toHaveCount(cardCount);

    await page.locator('.search-input').fill('');
    await expect(page.locator(pathNodes)).toHaveCount(totalNodes);
  });

  test('marks completed missions on the path', async ({ page }) => {
    await openMissionMap(page, ['hello-soroban', 'greetings-protocol']);

    await expect(page.locator(pathNodes).nth(0)).toContainText('✓');
    await expect(page.locator(pathNodes).nth(1)).toContainText('✓');
    await expect(page.locator(pathNodes).nth(2)).not.toContainText('✓');
  });

  test('only matches completed mission ids exactly', async ({ page }) => {
    await openMissionMap(page, ['hello-soroban\ngreetings-protocol']);

    await expect(page.locator(pathNodes).nth(0)).not.toContainText('✓');
    await expect(page.locator(pathNodes).nth(1)).not.toContainText('✓');
  });
});
