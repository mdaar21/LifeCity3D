import {expect,test,type Page} from '@playwright/test';
import type {GameSnapshot} from '../../src/lib/types';
async function guest(page:Page):Promise<GameSnapshot>{return page.evaluate(async()=>{const db=await new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open('lifecity-private-cache');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});return new Promise<GameSnapshot>((resolve,reject)=>{const r=db.transaction('records').objectStore('records').get('guest-world-v1');r.onsuccess=()=>resolve(r.result.state as GameSnapshot);r.onerror=()=>reject(r.error);});});}
test('guest demo remains local, preserves language and placements, and blocks offline writes',async({page,context})=>{
 await page.goto('/');await page.getByRole('button',{name:'جرّبها أولًا',exact:true}).click();await expect(page).toHaveURL(/\/dashboard/);await expect(page.getByTestId('wallet-balance')).toBeVisible();
 await page.locator('.language-switch').click();await expect.poll(async()=>(await guest(page)).profile.language).toBe('en');
 await page.goto('/tasks');await expect(page.locator('html')).toHaveAttribute('dir','ltr');
 for(const balance of [40,50,100]){await page.locator('.task-card:not(.task-done)').first().getByRole('button',{name:'Mark complete',exact:true}).click();await expect.poll(async()=>(await guest(page)).wallet.balance).toBe(balance);}
 await page.goto('/shop');await page.getByTestId('purchase-tree').click();await expect.poll(async()=>(await guest(page)).wallet.balance).toBe(80);
 await page.goto('/city');await page.getByTestId('inventory-tree').click();await page.getByTestId('placement-x').fill('1');await page.getByTestId('placement-z').fill('2');await page.getByRole('button',{name:'Rotate 90 degrees',exact:true}).click();await page.getByTestId('commit-placement').click();
 await expect.poll(async()=>(await guest(page)).placements.length).toBe(1);const saved=await guest(page);expect(saved.placements[0]).toMatchObject({catalog_id:'tree',x:1,z:2,rotation:90});
 await page.reload();await expect(page.getByTestId(`placement-${saved.placements[0]!.id}`)).toBeVisible();expect((await guest(page)).wallet.balance).toBe(80);await expect(page.locator('html')).toHaveAttribute('lang','en');
 await context.setOffline(true);await expect(page.getByText('You are offline. Browse your last saved state; actions that change your balance are paused until connection returns.')).toBeVisible();expect((await guest(page)).wallet.balance).toBe(80);await context.setOffline(false);
});
