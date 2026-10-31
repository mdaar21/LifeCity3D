import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {chromium,expect} from '@playwright/test';
import {CATALOG} from '../src/lib/catalog';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5178','--strictPort'],{env:{...process.env,VITE_BACKEND_MODE:'demo'},stdio:['ignore','pipe','inherit']});
const browser=await chromium.launch({executablePath:existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']});
try{
 await new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Preview startup timed out')),10000);server.stdout.on('data',chunk=>{if(String(chunk).includes('5178')){clearTimeout(timer);resolve();}});server.once('exit',()=>reject(new Error('Preview closed early')));});
 const page=await browser.newPage({viewport:{width:1280,height:960}}),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>localStorage.setItem('lifecity-render-preferences-v1','high'));await page.goto('http://127.0.0.1:5178/');await page.getByRole('button',{name:'جرّبها أولًا',exact:true}).click();await page.locator('.game-dock a[href="/shop"]').click();await mkdir('public/catalog',{recursive:true});
 const selected=process.argv.length>2?CATALOG.filter(item=>process.argv.slice(2).includes(item.id)):CATALOG;for(const item of selected){await page.getByTestId('preview-'+item.id).evaluate(el=>(el as HTMLButtonElement).click());await expect(page.locator('.shop-showcase h2')).toHaveText(item.name_ar);const canvas=page.locator('.shop-item-preview canvas');await expect.poll(async()=>Number(await canvas.getAttribute('data-rendered-frames'))).toBeGreaterThan(0);await canvas.screenshot({path:`public/catalog/${item.id}.png`});}
 if(errors.length)throw new Error(errors.join('\n'));console.log(`Captured ${selected.length} original playable asset thumbnails; no purchases or account writes.`);
}finally{await browser.close();server.kill('SIGTERM');}
