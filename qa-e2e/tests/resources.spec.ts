import { test, expect } from '@playwright/test';

const PATH = '/resources.html';

test.describe('Resource Hub – smoke', () => {
  test('loads and shows main elements', async ({ page }) => {
    const res = await page.goto(PATH, { waitUntil: 'load' });
    expect(res?.ok()).toBeTruthy();

    await expect(page).toHaveTitle(/Resource Hub/i);
    const h1 = page.locator('h1');
    await expect(h1).toContainText(/Resource Hub|Everything you need on site/i);

    const filter = page.locator('input#filter');
    await expect(filter).toBeVisible();

    const shortcuts = page.locator('#shortcuts a');
    const shortcutCount = await shortcuts.count();
    expect(shortcutCount).toBeGreaterThan(0);

    const target = await shortcuts.first().getAttribute('target');
    expect(target).toBe('_blank');

    const accordions = page.locator('details.accordion, details[open], details');
    expect(await accordions.count()).toBeGreaterThan(4);
  });

  test('filter reduces results and finds UV and outage links', async ({ page }) => {
    await page.goto(PATH);

    const shortcuts = page.locator('#shortcuts a');
    const before = await shortcuts.count();

    const filter = page.locator('input#filter');
    await filter.fill('uv');
    await page.waitForTimeout(250);
    const afterUV = await shortcuts.count();
    expect(afterUV).toBeGreaterThan(0);
    expect(afterUV).toBeLessThanOrEqual(before);

    await filter.fill('');
    await page.waitForTimeout(250);

    await filter.fill('outage');
    await page.waitForTimeout(250);

    // Either appears in shortcuts or inside state sections:
    const foundInShortcuts = await shortcuts.count();
    const stateLinks = page.locator('#states a:has-text("Outage"), #states a:has-text("outage")');
    const foundInStates = await stateLinks.count();

    expect(foundInShortcuts + foundInStates).toBeGreaterThan(0);
  });

  test('has official sources visible (BOM, Healthdirect, SWA, ABCB)', async ({ page }) => {
    await page.goto(PATH);

    for (const domain of [
      'bom.gov.au',
      'healthdirect.gov.au',
      'safeworkaustralia.gov.au',
      'abcb.gov.au'
    ]) {
      await expect(page.locator(`a[href*="${domain}"]`).first(), `Missing link for ${domain}`).toBeVisible();
    }
  });

  test('mobile layout renders (sanity)', async ({ page }) => {
    await page.goto(PATH);
    await expect(page.locator('input#filter')).toBeVisible();
    await expect(page.locator('nav.nav')).toBeVisible();
  });
});
