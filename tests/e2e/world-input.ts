import {expect,type Page} from '@playwright/test';
import {Matrix4,Vector3} from 'three';
/** Project a real world position through the actual rendered camera, then use native input. */
export async function worldPixel(page:Page,x:number,z:number,y=0,realm:'main'|'yuyi'='main'){
 const canvas=page.locator('[data-testid="city-canvas"] canvas');await expect(canvas).toBeVisible();
 await expect.poll(()=>page.evaluate(()=>!!(window as unknown as {__LIFECITY_RENDER_METRICS__?:{camera?:{projection:number[];inverse:number[]}}}).__LIFECITY_RENDER_METRICS__?.camera?.projection)).toBe(true);
 const c=await page.evaluate(()=>(window as unknown as {__LIFECITY_RENDER_METRICS__?:{camera?:{projection:number[];inverse:number[]}}}).__LIFECITY_RENDER_METRICS__!.camera!),box=(await canvas.boundingBox())!;
 const p=new Vector3((realm==='main'?-17:1)+x,y,-8+z).applyMatrix4(new Matrix4().fromArray(c.inverse)).applyMatrix4(new Matrix4().fromArray(c.projection));
 return {x:box.x+(p.x+1)*box.width/2,y:box.y+(1-p.y)*box.height/2};
}
export async function pickLegacyLocation(page:Page,x:number,z:number,realm:'main'|'yuyi'='main'){
 const at=await worldPixel(page,x+.15,z+.15,.02,realm);await page.mouse.click(at.x,at.y);
}
export async function dragDraft(page:Page,x:number,z:number,width=1,depth=1){
 const at=await worldPixel(page,x+width/2,z+depth/2,.01);await page.mouse.move(at.x-3,at.y-3);await page.mouse.down();await page.mouse.move(at.x,at.y,{steps:3});await page.mouse.up();
}
export async function shopSection(page:Page,section:string){
 await page.locator('.game-dock a[href="/shop"]').click();await page.getByRole('group',{name:'Shop sections'}).getByRole('button',{name:section,exact:true}).click();
}
