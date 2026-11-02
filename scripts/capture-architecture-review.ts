import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {ASSET_ART,assetArtPath} from '../src/world/asset-catalog';
const dir='docs/evidence/comprehensive-upgrade/architecture-after',browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']});
try{
 await mkdir(dir,{recursive:true});const p=await browser.newPage({viewport:{width:300,height:260}}),errors:string[]=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:5178/__catalog-art');const rows=[];
 for(const a of ASSET_ART.filter(a=>a.family==='building'||a.family==='legacy'&&['house','villa','apartment','skyscraper','palace'].includes(a.id))){const styles=a.family==='building'&&!a.id.startsWith('tower_')?['forest','coastal','desert']:['forest'];
  for(const style of styles){await p.locator('#asset-select').selectOption(a.key);await p.locator('#style-select').selectOption(style);await expect(p.locator('canvas')).toHaveAttribute('data-asset',a.key);await expect(p.locator('canvas')).toHaveAttribute('data-style',style);const file=a.key.replace(':','-')+'-'+style+'.png';await p.locator('canvas').screenshot({path:dir+'/'+file,omitBackground:true});if(style==='forest')await p.locator('canvas').screenshot({path:'public/'+assetArtPath(a.key),omitBackground:true});rows.push({asset:a.key,ar:a.ar,en:a.en,style,path:file});}
 }
 if(errors.length)throw Error(errors.join('\n'));await writeFile(dir+'/manifest.json',JSON.stringify({source:'Original procedural renderer; no account or city writes',rows},null,2)+'\n');console.log(JSON.stringify({rendered:rows.length,errors}));
}finally{await browser.close();}
