import {test,expect,type Page} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
test.use({storageState:{cookies:[],origins:[]},viewport:{width:960,height:640},hasTouch:true});
const folder='docs/evidence/graphics-motion';
interface RenderMetrics {graphics?:{level:string;ao:boolean;bloom:boolean};camera?:{zoom:number};dpr:number;drawingBufferWidth:number;drawingBufferHeight:number;calls:number;triangles:number}
type RenderWindow=Window&{__LIFECITY_RENDER_METRICS__?:RenderMetrics};
async function showSettings(page:Page){await page.getByRole('button',{name:/^(Game menu|قائمة اللعبة)$/}).click();await page.getByRole('dialog').locator('a[href="/settings"]').click();await page.getByTestId('graphics-settings').waitFor();}
test('four real graphics levels render both camera types, persist locally and preserve game data',async({page})=>{
 test.setTimeout(240000);await mkdir(folder,{recursive:true});const errors:string[]=[],samples:unknown[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('/login');await page.getByRole('button',{name:/استكشف التجربة المحلية|Explore.*local/i}).click();await page.getByTestId('play-explore').waitFor();
 const wallets={main:await page.getByTestId('wallet-balance').textContent(),mad:await page.getByTestId('yuyi-hud').textContent()};
 const state=()=>page.evaluate(async path=>{const{demoApi}=await import(path);const s=await demoApi.getState();return {wallet:s.wallet,mad:s.v6?.yuyi_wallet,inventory:s.inventory,placements:s.placements,components:s.world_systems?.components};},'/src/lib/demo.ts');
 const original=await state();
 for(const mode of ['aerial','walking']){
  if(mode==='walking')await page.getByTestId('play-explore').click();
  for(const level of ['low','medium','high','ultra']){
   await showSettings(page);await page.getByTestId('graphics-'+level).click();await expect(page.getByTestId('graphics-'+level)).toHaveAttribute('aria-pressed','true');
   if(mode==='walking'&&level==='ultra')await page.screenshot({path:folder+'/settings-four-levels.png'});
   await page.locator('.game-window-bar .game-close').click();
   await expect.poll(()=>page.evaluate(()=>(window as RenderWindow).__LIFECITY_RENDER_METRICS__?.graphics?.level)).toBe(level);
   const metric=await page.evaluate(()=>{const m=(window as RenderWindow).__LIFECITY_RENDER_METRICS__!;return {graphics:m.graphics,zoom:m.camera?.zoom,dpr:m.dpr,pixels:m.drawingBufferWidth*m.drawingBufferHeight,calls:m.calls,triangles:m.triangles};});
   expect(metric.graphics?.ao).toBe(level==='high'||level==='ultra');expect(metric.graphics?.bloom).toBe(level==='ultra');expect(metric.pixels).toBeLessThanOrEqual(2_610_000);if(mode==='walking')expect(metric.zoom).toBe(1);
   // Decode a real compositor screenshot. A functioning canvas must contain a
   // visible world after every pipeline/camera switch, including orthographic AO.
   const png=await page.locator('[data-testid="city-canvas"] canvas').screenshot({path:`${folder}/render-${mode}-${level}.png`});
   const visible=await page.evaluate(async data=>{const im=new Image();im.src='data:image/png;base64,'+data;await im.decode();const c=document.createElement('canvas');c.width=32;c.height=32;const ctx=c.getContext('2d')!;ctx.drawImage(im,0,0,32,32);const pixels=ctx.getImageData(0,0,32,32).data;let bright=0;for(let i=0;i<pixels.length;i+=4)if(pixels[i]+pixels[i+1]+pixels[i+2]>65)bright++;return bright;},png.toString('base64'));expect(visible).toBeGreaterThan(150);samples.push({mode,level,visible,...metric});
  }
 }
 await page.setViewportSize({width:390,height:844});await showSettings(page);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:folder+'/settings-390.png'});await page.locator('.game-window-bar .game-close').click();await page.reload();await page.getByTestId('play-explore').waitFor();await expect.poll(()=>page.evaluate(()=>(window as RenderWindow).__LIFECITY_RENDER_METRICS__?.graphics?.level)).toBe('ultra');
 expect(await state()).toEqual(original);await expect(page.getByTestId('wallet-balance')).toHaveText(wallets.main!);await expect(page.getByTestId('yuyi-hud')).toHaveText(wallets.mad!);expect(errors).toEqual([]);
 await writeFile(folder+'/quality-browser.json',JSON.stringify({samples,savedPresetRestored:true,mobileLayoutNoOverflow:true,gameDataUnchanged:true,errors,scope:'Local guest; software Chromium WebGL. No physical-phone FPS or cloud-account writes.'},null,2)+'\n');
});
