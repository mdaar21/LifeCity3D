import {chromium} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});
const context=await browser.newContext({viewport:{width:1280,height:900}});const page=await context.newPage();
const base=process.env.REVIEW_BASE||'http://127.0.0.1:5175';
const results=[];
await page.goto(base);await page.getByRole('button',{name:'جرّبها أولًا',exact:true}).click();await page.waitForURL('**/city');await page.waitForSelector('[data-testid="wallet-balance"]');
for(const theme of ['light','dark']){
 await page.evaluate(async(theme)=>{const db=await new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open('lifecity-private-cache');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});await new Promise<void>((resolve,reject)=>{const tx=db.transaction('records','readwrite');const store=tx.objectStore('records');const r=store.get('guest-world-v1');r.onsuccess=()=>{const value=r.result;value.state.profile.theme=theme;store.put(value,'guest-world-v1');};tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});},theme);
 for(const route of ['dashboard','city','tasks','timer','shop','prayers','yuyi','stats','settings','interior']){
 await page.goto(base+'/'+route);await page.locator('h1').first().waitFor();await page.waitForFunction((theme)=>document.documentElement.dataset.theme===theme,theme);
 const scan=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa']).analyze();
 results.push({route,theme,violations:scan.violations.map(v=>({id:v.id,impact:v.impact,description:v.description,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary,html:n.html.slice(0,300)}))}))});
 }
}
await browser.close();await writeFile('docs/evidence/accessibility.json',JSON.stringify(results,null,2)+'\n');
console.log(JSON.stringify(results.map(r=>({route:r.route,theme:r.theme,issues:r.violations.map(v=>({id:v.id,nodes:v.nodes.length}))}))));
