import {AssetThumbnail} from './AssetThumbnail';
import {useRef,useState} from 'react';
import {Building2,Check,Coins,Flag,HardHat,Plus,Undo2} from 'lucide-react';
import {Link} from 'react-router-dom';
import {useGame} from '../lib/game';
import {useLocale} from '../lib/locale';
import {localizeError} from '../lib/errors';
import {levelFromXp} from '../lib/rules';
import {Button,Modal,Notice} from './Common';

function Construction({progress,label}: {progress:number;label:string}) {
 const stage=progress>=1?3:progress>=0.6?2:progress>0?1:0;
 return <svg className="project-art" viewBox="0 0 360 235" role="img" aria-label={label} data-stage={stage}>
  <ellipse cx="180" cy="205" rx="147" ry="14" fill="currentColor" opacity=".06"/>
  <path d="M24 156L177 93L334 158L180 224Z" fill="#a2b68a"/><path d="M24 156L180 224V233L24 165Z" fill="#8e9e78"/><path d="M180 224L334 158V167L180 233Z" fill="#718967"/>
  <path d="M59 151L178 105L296 153L180 203Z" fill="none" stroke="#f6f3e9" strokeDasharray={stage===0?'5 4':undefined}/>
  {stage>=1&&<><path d="M103 157L178 127L254 158L178 188Z" fill="#cfc9b5"/><path d="M103 157V167L178 198V188Z" fill="#b1ae9a"/></>}
  {stage>=2&&<g stroke="#bc945b" strokeWidth="5" fill="none"><path d="M109 159V77L178 49L247 78V160M178 49V187M109 116L178 88L247 117M109 77L178 106L247 78M178 106V187"/></g>}
  {stage>=3&&<><path d="M109 92L178 65L247 93V160L178 189L109 160Z" fill="#f6f0d9"/><path d="M178 121L247 93V160L178 189Z" fill="#d7dfcd"/><path d="M101 93L174 42L255 92L178 124Z" fill="#3a6658"/><path d="M188 138L204 131V153L188 160ZM219 126L236 119V141L219 148Z" fill="#91bdc2"/><path d="M139 141V171L158 179V148Z" fill="#a27954"/><path d="M81 164V132" stroke="#876c4e" strokeWidth="5"/><ellipse cx="81" cy="126" rx="18" ry="24" fill="#638b64"/></>}
  {stage<3&&<g stroke="#bc945b" strokeWidth="4" fill="none"><path d="M283 153V31H179M273 153V31M245 31L283 9L299 31H312M283 43H179M203 44V76"/><path d="M197 77Q203 91 209 77"/></g>}
 </svg>;
}

export default function DreamProject() {
 const {state,mutate,online}=useGame();const {t,number,language}=useLocale();
 const [choice,setChoice]=useState('house');const [amount,setAmount]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [cancel,setCancel]=useState(false);const lock=useRef(false);
 if(!state)return null;
 const projects=state.projects??[];const active=projects.find(v=>v.status==='saving');const completed=projects.find(v=>v.status==='completed');
 const eligible=state.catalog.filter(v=>['house','villa','apartment','skyscraper','palace'].includes(v.model));const item=state.catalog.find(v=>v.id===(active?.catalog_id??choice));
 const remaining=active?active.target_price-active.funded:0;const maximum=Math.max(0,Math.min(state.wallet.balance,remaining));const contribution=Number(amount);const valid=Number.isSafeInteger(contribution)&&contribution>0&&contribution<=maximum;
 const progress=active?active.funded/active.target_price:completed?1:0;
 const stages=[t('المخطط ينتظر أول خطوة','A blueprint for your next step'),t('الأساسات تتشكل','Foundations take shape'),t('أحلامك ترتفع','Your dream takes shape'),t('جاهز لمكانه في مدينتك','Ready for a place in your city')];
 const stageLabel=stages[progress>=1?3:progress>=0.6?2:progress>0?1:0];
 async function act(action:string,payload:Record<string,unknown>){if(lock.current)return;lock.current=true;setBusy(true);setError('');try{await mutate(action,payload);setAmount('');setCancel(false);}catch(e){setError(localizeError(e,language));}finally{lock.current=false;setBusy(false);}}
 return <section className="dream-project panel" data-testid="dream-project" aria-label={t('مشروع أحلامك','Your dream project')}>
  <div className="project-story"><p className="eyebrow"><Flag size={15}/>{t('هدف تراه يكبر','A GOAL YOU CAN SEE GROW')}</p><h2>{t('مشروع أحلامك','Your dream project')}</h2><p>{t('خطوة بعد خطوة، ادّخر لمبناك القادم. كل مساهمة من عملاتك تقرّب المخطط من الاكتمال.','Build towards your next home, one contribution at a time. Reserve earned coins and watch the blueprint take shape.')}</p><Construction progress={progress} label={stageLabel}/><span className="project-stage"><HardHat size={16}/>{stageLabel}</span><small className="muted">{t('رسم توضيحي لمراحل الادخار. المبنى لا يوضع في أرضك تلقائيًا.','An illustration of saving milestones. Buildings are never placed on your land automatically.')}</small></div>
  <div className="project-controls">{item&&<AssetThumbnail assetKey={'legacy:'+item.id}/>}
   {error&&<Notice tone="danger">{error}</Notice>}
   {active?<><span className="chip"><Building2 size={15}/>{t('مشروع قيد الادخار','SAVING IN PROGRESS')}</span><h3>{item?t(item.name_ar,item.name_en):active.catalog_id}</h3><div className="project-amount"><b dir="ltr" data-testid="project-funded">{number(active.funded)}</b><span>/ {number(active.target_price)} {t('عملة','coins')}</span></div><div className="project-progress" role="progressbar" aria-label={t('تمويل مشروعك','Project funding')} aria-valuenow={active.funded} aria-valuemin={0} aria-valuemax={active.target_price}><span style={{width:`${progress*100}%`}}/></div><p className="muted">{t('المتبقي','Remaining')}: {number(remaining)} · {t('رصيدك المتاح','Available')}: {number(state.wallet.balance)}</p>
    <form onSubmit={e=>{e.preventDefault();if(valid)void act('project_contribute',{project_id:active.id,amount:contribution});}}><label className="field"><span>{t('كم تود تخصيصه الآن؟','How much would you like to reserve?')}</span><input className="input" data-testid="project-contribution" type="number" min="1" max={maximum||undefined} step="1" inputMode="numeric" dir="ltr" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="40" disabled={!online||busy||maximum===0}/></label><div className="project-buttons"><Button type="submit" disabled={!valid||!online||busy} loading={busy}><Plus size={17}/>{t('خصّص للمشروع','Reserve for project')}</Button><Button variant="ghost" type="button" disabled={maximum===0||busy||!online} onClick={()=>setAmount(String(maximum))}>{t('المتاح كله','All available')}</Button></div></form><small className="muted">{t('تُخصم المساهمة من رصيدك المتاح وتُحفظ للمشروع. عند اكتماله يُضاف المبنى مرة واحدة للمخزون؛ تختار مكانه بنفسك.','Contributions leave your available balance and are saved towards the project. When fully funded, the building is added to inventory once for you to place.')}</small><Button variant="ghost" onClick={()=>setCancel(true)} disabled={busy||!online}><Undo2 size={15}/>{t('إلغاء المشروع واستعادة المساهمات','Cancel and return contributions')}</Button>
   </>:<><h3>{t('ما المبنى الذي تتطلع إليه؟','What would you love to build?')}</h3><label className="field"><span>{t('اختر مشروعك','Choose your project')}</span><select className="input" data-testid="project-catalog" value={choice} onChange={e=>setChoice(e.target.value)} disabled={busy}>{eligible.map(v=><option key={v.id} value={v.id} disabled={v.unlock_level>levelFromXp(state.wallet.city_xp)}>{t(v.name_ar,v.name_en)} · {number(v.price)} {t('عملة','coins')}{v.unlock_level>levelFromXp(state.wallet.city_xp)?` · ${t('مستوى','Level')} ${number(v.unlock_level)}`:''}</option>)}</select></label><Button data-testid="project-start" onClick={()=>void act('project_start',{catalog_id:choice})} disabled={busy||!online||!item||item.unlock_level>levelFromXp(state.wallet.city_xp)} loading={busy}><Flag size={17}/>{t('ابدأ مشروع الادخار','Start saving project')}</Button><small className="muted">{t('اختيار الهدف مجاني. يمكنك المساهمة لاحقًا، أو إلغاء المشروع واستعادة ما خصصته.','Choosing a goal is free. Contribute later, or cancel and return your reserved coins.')}</small>{completed&&<div className="project-completed" data-testid="project-completed"><Check size={22}/><div><strong>{t('مشروعك السابق اكتمل!','Your last project is complete!')}</strong><p>{t('المبنى ينتظرك في المخزون.','Your building is waiting in inventory.')}</p><Link className="text-link" to="/city">{t('اختر مكانه في المدينة','Choose its place in your city')}</Link></div></div>}</>}
   <div className="project-rule"><Coins size={17}/>{t('عملات داخل اللعبة، دون دفع حقيقي.','In-game coins. No real-money payments.')}</div>
  </div>
  <Modal open={cancel} onClose={()=>{if(!busy)setCancel(false);}} title={t('إلغاء مشروع الادخار؟','Cancel your saving project?')}><p>{t('ستعود مساهماتك إلى الرصيد المتاح، دون تغيير خبرتك.','Your contributions return to your available balance. XP stays unchanged.')} <b>{number(active?.funded??0)} {t('عملة','coins')}</b></p><div className="project-buttons"><Button variant="danger" disabled={busy||!online||!active} loading={busy} onClick={()=>active&&void act('project_cancel',{project_id:active.id})} data-testid="project-cancel-confirm">{t('إلغاء واستعادة العملات','Cancel and return coins')}</Button><Button variant="secondary" disabled={busy} onClick={()=>setCancel(false)}>{t('أكمل مشروعي','Keep saving')}</Button></div></Modal>
 </section>;
}
