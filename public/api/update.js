/* global URL, document, clearTimeout, setTimeout, navigator, location */
// This route deliberately bypasses older Workbox navigation fallbacks (/api/).
// Never clear IndexedDB/localStorage/caches, or touch another application's worker.
const appBase=new URL('../',import.meta.url);
const status=document.querySelector('#update-status');
const retry=document.querySelector('#update-retry');
let busy=false;
function waitFor(worker,states){return new Promise((resolve,reject)=>{let timer;const changed=()=>{if(states.includes(worker.state)){cleanup();resolve();}else if(worker.state==='redundant'){cleanup();reject(new Error('UPDATE_FAILED'));}};const cleanup=()=>{clearTimeout(timer);worker.removeEventListener('statechange',changed);};worker.addEventListener('statechange',changed);timer=setTimeout(()=>{cleanup();reject(new Error('UPDATE_TIMEOUT'));},15000);changed();});}
async function update(){if(busy)return;busy=true;retry.hidden=true;status.textContent='نحمّل النسخة الجديدة مع الاحتفاظ بالحفظ والمخزون والأرصدة.';try{
 if(!navigator.onLine)throw new Error('OFFLINE');
 if('serviceWorker' in navigator){const registrations=await navigator.serviceWorker.getRegistrations();for(const registration of registrations){if(registration.scope!==appBase.href)continue;await registration.update();if(registration.installing)await waitFor(registration.installing,['installed','activated']);const waiting=registration.waiting;if(waiting){const activated=waitFor(waiting,['activated']);waiting.postMessage({type:'SKIP_WAITING'});await activated;}}}
 status.textContent='اكتمل التحديث. نفتح المهام الجديدة الآن…';location.replace(new URL('tasks',appBase).href);
 }catch{status.textContent='تعذّر تحميل التحديث. تأكد من الاتصال ثم أعد المحاولة؛ حفظك لم يُحذف.';retry.hidden=false;}finally{busy=false;}}
retry.addEventListener('click',()=>void update());
void update();
