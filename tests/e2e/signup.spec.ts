import {expect,test} from '@playwright/test';
import {E2E_PASSWORD} from './accounts';
test('new local account keeps the language chosen before signup across reload',async({page})=>{
 await page.goto('/login');await page.getByRole('button',{name:'English',exact:true}).click();await page.getByRole('button',{name:'Create account',exact:true}).click();
 await page.getByTestId('auth-name').fill('English builder');await page.getByTestId('auth-email').fill('signup-language@lifecity.test');await page.getByTestId('auth-password').fill(E2E_PASSWORD);await page.getByTestId('auth-submit').click();
 await expect(page).toHaveURL(/\/city/);await expect(page.locator('html')).toHaveAttribute('lang','en');
 const profile=await page.evaluate(async()=>{const response=await fetch('/api/state');return (await response.json()).profile as {language:string;display_name:string};});expect(profile).toMatchObject({language:'en',display_name:'English builder'});
 await page.reload();await expect(page.getByTestId('wallet-balance')).toHaveText('0');await expect(page.locator('html')).toHaveAttribute('dir','ltr');
});
