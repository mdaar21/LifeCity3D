import {useEffect,useRef} from 'react';
import {PartyPopper,X} from 'lucide-react';
import {useGame} from '../lib/game';
import {useLocale} from '../lib/locale';
import {useWorldUI} from './useWorldUI';
export function WorldCelebrations(){
 const {state,mutate,saveStatus,online}=useGame(),{t}=useLocale(),ghost=useWorldUI(s=>s.ghost),celebration=useWorldUI(s=>s.celebration),set=useWorldUI(s=>s.set),attempted=useRef(new Set<string>());
 const event=state?.world_systems?.events.find(e=>!e.seen&&['opening','surprise','phase_complete'].includes(e.kind)),enabled=state?.world_systems?.settings.celebrations_enabled,revision=state?.world_systems?.revision;
 useEffect(()=>{if(!event||!enabled||ghost||celebration||!online||saveStatus!=='saved'||attempted.current.has(event.id))return;attempted.current.add(event.id);set({celebration:{id:event.id,title:event.title,started_at:Date.now()}});void mutate('world_apply',{operation:'event_seen',request:{realm:event.realm,event_id:event.id},expected_revision:revision}).catch(()=>{attempted.current.delete(event.id);});},[event,enabled,ghost,celebration,online,saveStatus,revision,mutate,set]);
 useEffect(()=>{if(!celebration)return;const timer=setTimeout(()=>set({celebration:null}),4500);return()=>clearTimeout(timer);},[celebration,set]);
 if(!celebration||!enabled)return null;
 return <div className="world-celebration" role="status"><PartyPopper size={22}/><span><small>{t('لحظة تستحق أن تُحفظ','A MOMENT TO REMEMBER')}</small><strong>{celebration.title}</strong></span><button aria-label={t('تخطي الاحتفال','Skip celebration')} onClick={()=>set({celebration:null})}><X size={18}/></button></div>;
}
