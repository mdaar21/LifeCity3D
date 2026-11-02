import type {Page} from '@playwright/test';

/** The shop owns inventory; optional city tools live in More. */
export async function openInventory(page:Page){
 await page.locator('.game-dock a[href="/shop"]').click();
 await page.getByTestId('touch-inventory').click();
}
export async function openStudio(page:Page){
 await page.getByRole('button',{name:/^(Game menu|قائمة اللعبة)$/}).last().click();
 await page.getByTestId('world-studio').click();
}
