import { expect, test, type Page } from '@playwright/test';
import type { GameSnapshot } from '../../src/lib/types.js';
import { E2E_OTHER, E2E_OWNER, E2E_PASSWORD } from './accounts.js';

async function login(page: Page, email: string): Promise<void> {
  await page.goto('/login');
  await expect(page.locator('input[type="email"]')).toBeVisible();
  // Arabic is the default for a fresh browser; language can be chosen before login.
  if (await page.getByRole('button', {name: 'English', exact: true}).isVisible()) await page.getByRole('button', {name: 'English', exact: true}).click();
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[autocomplete="current-password"]').fill(E2E_PASSWORD);
  await page.getByRole('button', {name: 'Enter my city', exact: true}).click();
  await expect(page).toHaveURL(/\/city/);
}

async function snapshot(page: Page): Promise<GameSnapshot> {
  return page.evaluate(async () => {
    const response = await fetch('/api/state');
    if (!response.ok) throw new Error(`state_${response.status}`);
    return response.json() as Promise<GameSnapshot>;
  });
}

test('two browser contexts recover the exact purchased home, inventory, balance and rotation', async ({browser}) => {
  const deviceA = await browser.newContext();
  const deviceB = await browser.newContext();
  const pageA = await deviceA.newPage();
  const pageB = await deviceB.newPage();
  const errors: string[] = [];
  pageA.on('pageerror', (error) => errors.push(error.message));
  pageB.on('pageerror', (error) => errors.push(error.message));
  try {
    await deviceA.addInitScript(()=>localStorage.setItem('lifecity-tools-mode','advanced'));
    await deviceB.addInitScript(()=>localStorage.setItem('lifecity-tools-mode','advanced'));
    await login(pageA, E2E_OWNER);
    expect((await snapshot(pageA)).wallet.balance).toBe(2000);
    await pageA.goto('/shop');
    await pageA.getByTestId('purchase-house').click();
    await expect.poll(async () => (await snapshot(pageA)).wallet.balance).toBe(1200);
    await pageA.goto('/city');
    await pageA.getByTestId('city-tool-inventory').click();
    await pageA.getByTestId('inventory-house').click();
    await pageA.getByTestId('placement-x').fill('4');
    await pageA.getByTestId('placement-z').fill('6');
    await pageA.getByRole('button', {name: 'Rotate 90 degrees', exact: true}).click();
    await pageA.getByTestId('commit-placement').click();
    await expect.poll(async () => (await snapshot(pageA)).placements.length).toBe(1);
    const saved = await snapshot(pageA);
    const home = saved.placements[0]!;
    expect(home).toMatchObject({catalog_id: 'house', x: 4, z: 6, rotation: 90, version: 1});
    expect(saved.inventory).toHaveLength(1);
    await pageA.getByTestId('city-tool-objects').click();
    await expect(pageA.getByTestId(`placement-${home.id}`)).toContainText('4, 6 · 90°');
    await login(pageB, E2E_OWNER);
    await pageB.goto('/city');
    await pageB.getByTestId('city-tool-objects').click();
    await expect(pageB.getByTestId(`placement-${home.id}`)).toContainText('4, 6 · 90°');
    expect((await snapshot(pageB)).wallet).toEqual(saved.wallet);
    expect((await snapshot(pageB)).inventory).toEqual(saved.inventory);
    expect((await snapshot(pageB)).placements).toEqual(saved.placements);
    await pageA.reload();
    await pageB.reload();
    await pageA.getByTestId('city-tool-objects').click();
    await pageB.getByTestId('city-tool-objects').click();
    await expect(pageA.getByTestId(`placement-${home.id}`)).toBeVisible();
    await expect(pageB.getByTestId(`placement-${home.id}`)).toBeVisible();
    expect((await snapshot(pageA)).wallet.balance).toBe(1200);
    expect((await snapshot(pageB)).placements[0]).toMatchObject({id: home.id, x: 4, z: 6, rotation: 90});
    expect(errors).toEqual([]);
  } finally { await deviceA.close(); await deviceB.close(); }
});

test('an independent account has an empty city and cannot mutate another account inventory', async ({browser}) => {
  const accountA = await browser.newContext();
  const accountB = await browser.newContext({viewport: {width: 390, height: 844}});
  const pageA = await accountA.newPage();
  const pageB = await accountB.newPage();
  try {
    await login(pageA, E2E_OWNER);
    await login(pageB, E2E_OTHER);
    const owner = await snapshot(pageA);
    const other = await snapshot(pageB);
    expect(other.profile.id).not.toBe(owner.profile.id);
    expect(other.wallet.balance).toBe(0);
    expect(other.inventory).toHaveLength(0);
    expect(other.placements).toHaveLength(0);
    await pageB.goto('/city');
    await expect(pageB.getByRole('heading', {name: 'My city', exact: true})).toBeVisible();
    await expect(pageB.locator('[data-testid^="placement-"]')).toHaveCount(0);
    const rejected = await pageB.evaluate(async (inventoryId) => {
      const response = await fetch('/api/command', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({action: 'place', payload: {inventory_id: inventoryId, x: 0, z: 0, rotation: 0}, key: crypto.randomUUID()})});
      return {status: response.status, body: await response.json() as {error: string}};
    }, owner.inventory[0]!.id);
    expect(rejected.status).toBe(400);
    expect(rejected.body.error).toBe('NOT_OWNED');
    await pageB.reload();
    expect((await snapshot(pageB)).wallet.balance).toBe(0);
    expect((await snapshot(pageB)).placements).toHaveLength(0);
    expect((await snapshot(pageA)).placements).toEqual(owner.placements);
    expect(await pageB.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  } finally { await accountA.close(); await accountB.close(); }
});
