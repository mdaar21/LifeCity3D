import {expect,test} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {mkdir,writeFile} from 'node:fs/promises';

test('game windows preserve the city canvas, menu keyboard access and a running focus session',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await page.getByRole('button',{name:'جرّبها أولًا',exact:true}).click();await expect(page).toHaveURL(/\/city/);
 const canvas=page.locator('.game-world canvas');await expect(canvas).toBeVisible();const world=await canvas.elementHandle();
 await page.locator('.game-dock a[href="/tasks"]').click();await expect(page.locator('.task-card')).toHaveCount(3);
 expect(await world!.evaluate(el=>el.isConnected)).toBe(true);await expect(page.locator('.game-world')).toHaveAttribute('inert','');
 await page.keyboard.press('Escape');await expect(page).toHaveURL(/\/city/);await expect(page.locator('.game-dock a[href="/city"]')).toBeFocused();
 await page.getByRole('button',{name:'قائمة اللعبة',exact:true}).last().click();const menu=page.getByRole('dialog');await expect(menu).toBeVisible();await menu.getByRole('button',{name:'English',exact:true}).click();
 await page.keyboard.press('Escape');await expect(menu).toHaveCount(0);await expect(page.getByRole('button',{name:'Game menu',exact:true}).last()).toBeFocused();
 await page.locator('.game-dock a[href="/timer"]').click();await page.getByRole('button',{name:'Start focusing',exact:true}).click();await expect(page.getByRole('button',{name:'Take a pause',exact:true})).toBeVisible();
 await page.locator('.game-dock a[href="/tasks"]').click();await expect(page.getByTestId('active-focus')).toContainText('Focus session running');
 await page.clock.install();
 // Demo uses its own authoritative local adapter, so verify progression through
 // the saved session on a menu change rather than fabricating server credit.
 await page.clock.fastForward(30_001);await page.getByTestId('active-focus').click();await expect(page.getByRole('button',{name:'Take a pause',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Take a pause',exact:true}).click();await page.locator('.game-dock a[href="/city"]').click();await expect(page.getByTestId('active-focus')).toContainText('Focus session paused');
 expect(await world!.evaluate(el=>el.isConnected)).toBe(true);expect(errors).toEqual([]);
});

test('game HUD and panels fit desktop and phone in Arabic, English and dark mode',async({page})=>{
 const scans=[];await mkdir('docs/evidence/ui',{recursive:true});
 await page.goto('/');await page.getByRole('button',{name:'جرّبها أولًا',exact:true}).click();await expect(page).toHaveURL(/\/city/);
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:width===390?844:960});
  for(const route of ['city','tasks','shop','timer']){
   await page.locator(`.game-dock a[href="/${route}"]`).click();
   if(route!=='city'){await expect(page.locator('.game-window-scroll .page')).toBeVisible();await page.locator('.game-window').evaluate(async el=>{await Promise.all(el.getAnimations().map(animation=>animation.finished));});}
   if(route==='city')await expect.poll(async()=>Number(await page.locator('.game-world canvas').getAttribute('data-rendered-frames'))).toBeGreaterThan(0);
   const layout=await page.evaluate(()=>{const panel=document.querySelector('.game-window-scroll');return {bodyFits:document.documentElement.scrollWidth<=innerWidth,panelFits:!panel||panel.scrollWidth<=panel.clientWidth+1};});expect(layout).toEqual({bodyFits:true,panelFits:true});
   const scan=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa']).analyze();scans.push({width,route,language:'ar',violations:scan.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))});expect(scan.violations).toEqual([]);
   await page.screenshot({path:`docs/evidence/ui/game-${route}-${width}.png`});
  }
 }
 await page.getByRole('button',{name:'قائمة اللعبة',exact:true}).last().click();const menu=page.getByRole('dialog');await menu.getByRole('button',{name:'English',exact:true}).click();await page.keyboard.press('Escape');
 await page.evaluate(()=>{document.documentElement.dataset.theme='dark';});await page.locator('.game-dock a[href="/tasks"]').click();await expect(page.locator('html')).toHaveAttribute('dir','ltr');
 await page.locator('.game-window').evaluate(async el=>{await Promise.all(el.getAnimations().map(animation=>animation.finished));});
 const dark=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa']).analyze();scans.push({width:390,route:'tasks',language:'en-dark',violations:dark.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))});expect(dark.violations).toEqual([]);await page.screenshot({path:'docs/evidence/ui/game-tasks-en-dark-390.png'});
 await writeFile('docs/evidence/game-shell-accessibility.json',JSON.stringify(scans,null,2)+'\n');
});
