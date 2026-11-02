import {test,expect} from '@playwright/test';
test.use({storageState:{cookies:[],origins:[]},viewport:{width:390,height:844},hasTouch:true,isMobile:true});

test('walking camera survives every menu return and still accepts wheel and native pinch zoom',async({page})=>{
 test.setTimeout(120000);
 await page.goto('/login');await page.getByRole('button',{name:/استكشف التجربة المحلية|Explore.*local/i}).click();await page.getByTestId('play-explore').click();
 const camera=()=>page.evaluate(()=>(window as Window&{__LIFECITY_RENDER_METRICS__?:{camera:{zoom:number;projection:number[];x:number;y:number;z:number}}}).__LIFECITY_RENDER_METRICS__?.camera);
 await expect.poll(async()=>(await camera())?.zoom).toBe(1);
 const scene=page.locator('[data-testid="city-canvas"] canvas'),sceneBox=(await scene.boundingBox())!;
 await page.mouse.move(sceneBox.width*.5,sceneBox.height*.4);await page.mouse.wheel(0,120);await page.mouse.down({button:'right'});await page.mouse.move(sceneBox.width*.5-55,sceneBox.height*.4+15,{steps:6});await page.mouse.up({button:'right'});await page.waitForTimeout(900);
 const before=(await camera())!,wallet=await page.getByTestId('wallet-balance').textContent(),mad=await page.getByTestId('yuyi-hud').textContent();
 for(const route of ['tasks','timer','shop','dashboard','prayers','stats','economy','yuyi','settings','interior']){
  if(['tasks','timer','shop'].includes(route))await page.locator(`.game-dock a[href="/${route}"]`).click();
  else{await page.getByRole('button',{name:/^(Game menu|قائمة اللعبة)$/}).click();await page.getByRole('dialog').locator(`a[href="/${route}"]`).click();}
  await expect(page.locator('main.game-window')).toBeVisible();await page.locator('.game-window-bar .game-close').click();
  await expect(page.getByTestId('play-explore')).toHaveAccessibleName(/City view|منظور المدينة/);
  await expect.poll(async()=>(await camera())?.zoom).toBe(1);
  await expect.poll(async()=>Math.abs(((await camera())?.projection[0]??0)-before.projection[0])).toBeLessThan(.001);
  await expect.poll(async()=>{const c=(await camera())!;return Math.hypot(c.x-before.x,c.y-before.y,c.z-before.z);}).toBeLessThan(.04);
 }
 for(let repeat=0;repeat<3;repeat++){await page.getByRole('button',{name:/^(Game menu|قائمة اللعبة)$/}).click();await page.getByRole('dialog').getByRole('button',{name:/^(Close|إغلاق)$/}).click();await expect.poll(async()=>(await camera())?.zoom).toBe(1);}
 await page.getByRole('button',{name:/^(Game menu|قائمة اللعبة)$/}).click();await page.getByTestId('world-studio').click();await page.getByRole('button',{name:/^(Close studio|إغلاق الورشة)$/}).click();await expect.poll(async()=>(await camera())?.zoom).toBe(1);
 const canvas=page.locator('[data-testid="city-canvas"] canvas'),box=(await canvas.boundingBox())!,at={x:box.x+box.width*.5,y:box.y+box.height*.45};await page.mouse.move(at.x,at.y);const pre=(await camera())!;await page.mouse.wheel(0,300);await expect.poll(async()=>{const c=(await camera())!;return Math.hypot(c.x-pre.x,c.y-pre.y,c.z-pre.z);}).toBeGreaterThan(.5);
 const cdp=await page.context().newCDPSession(page),prePinch=(await camera())!;await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:at.x-65,y:at.y,id:1},{x:at.x+65,y:at.y,id:2}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:at.x-30,y:at.y,id:1},{x:at.x+30,y:at.y,id:2}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await expect.poll(async()=>{const c=(await camera())!;return Math.hypot(c.x-prePinch.x,c.y-prePinch.y,c.z-prePinch.z);}).toBeGreaterThan(.5);
 await page.setViewportSize({width:844,height:390});await expect.poll(async()=>(await camera())?.zoom).toBe(1);await expect(page.locator('.explore-bar')).toHaveCount(0);await expect(page.getByTestId('wallet-balance')).toHaveText(wallet!);await expect(page.getByTestId('yuyi-hud')).toHaveText(mad!);
});
