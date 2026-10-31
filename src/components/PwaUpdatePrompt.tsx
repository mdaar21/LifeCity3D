import {useEffect,useRef,useState} from 'react';
import {useRegisterSW} from 'virtual:pwa-register/react';
import {RefreshCw} from 'lucide-react';
import {useGame} from '../lib/game';
import {useLocale} from '../lib/locale';
import {Button} from './Common';
import './pwa-update.css';

/** Prompted updates preserve saved data and settle a running focus session first. */
export function PwaUpdatePrompt(){
 const {state,saveStatus,online,mutate}=useGame();const {t}=useLocale();const registration=useRef<ServiceWorkerRegistration|undefined>(undefined);const [busy,setBusy]=useState(false);const [failed,setFailed]=useState(false);const lock=useRef(false);
 const {needRefresh:[needRefresh],updateServiceWorker}=useRegisterSW({onRegisteredSW(_url,r){registration.current=r;}});
 useEffect(()=>{const check=()=>{if(navigator.onLine&&document.visibilityState==='visible'&&registration.current?.active)void registration.current.update().catch(()=>{});};window.addEventListener('focus',check);window.addEventListener('online',check);const timer=window.setInterval(check,3600000);return()=>{window.removeEventListener('focus',check);window.removeEventListener('online',check);window.clearInterval(timer);};},[]);
 async function update(){if(lock.current||!online||saveStatus==='saving')return;lock.current=true;setBusy(true);setFailed(false);try{const active=state?.study_sessions.find(s=>s.status==='running');if(active)await mutate('study_pause',{session_id:active.id});await updateServiceWorker(true);}catch{setFailed(true);}finally{lock.current=false;setBusy(false);}}
 if(!needRefresh)return null;
 return <aside className="pwa-update-prompt" role="status" data-testid="pwa-update-prompt"><div><strong>{t('تحديث اللعبة جاهز','Game update ready')}</strong><p>{t('تقدّمك المحفوظ يبقى كما هو. سنوقف جلسة التركيز مؤقتًا إن كانت تعمل.','Saved progress stays intact. A running focus session will be paused first.')}</p>{failed&&<p>{t('تعذّر إتمام التحديث. راجع الاتصال وحاول مجددًا.','Update could not finish. Check your connection and retry.')}</p>}</div><Button disabled={busy||!online||saveStatus==='saving'} loading={busy} onClick={()=>void update()}><RefreshCw size={17}/>{t('تحديث الآن','Update now')}</Button></aside>;
}
