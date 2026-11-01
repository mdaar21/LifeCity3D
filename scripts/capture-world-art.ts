import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {dirname} from 'node:path';
import {ASSET_ART,assetArtPath} from '../src/world/asset-catalog';
const start=Number(process.argv[2]??0),count=Number(process.argv[3]??20);
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']});
try{const page=await browser.newPage({viewport:{width:300,height:240}});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:5178/__catalog-art');for(const a of ASSET_ART.slice(start,start+count)){await page.locator('#asset-select').selectOption(a.key);await expect(page.locator('canvas')).toHaveAttribute('data-asset',a.key);const path='public/'+assetArtPath(a.key);await mkdir(dirname(path),{recursive:true});await page.locator('canvas').screenshot({path,omitBackground:true});}if(errors.length)throw Error(errors.join('\n'));await writeFile('public/catalog/manifest.json',JSON.stringify({source:'Original LifeCity procedural models; no account or city mutations',width:240,height:180,assets:ASSET_ART.map(a=>({...a,path:assetArtPath(a.key)}))},null,2)+'\n');console.log(`Captured ${ASSET_ART.slice(start,start+count).length} real asset renders (${start}/${ASSET_ART.length}).`);}finally{await browser.close();}
