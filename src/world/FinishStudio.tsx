import {AssetThumbnail} from '../components/AssetThumbnail';
import {useEffect,useMemo,useState} from 'react';
import {useGame} from '../lib/game';
import {useLocale} from '../lib/locale';
import {useMoney} from '../lib/useMoney';
import {viewWorldContext} from '../lib/world-state';
import {localizeError} from '../lib/errors';
import {worldTransition} from '../../supabase/functions/_shared/world-engine';
import {amount,money} from '../../supabase/functions/_shared/world-math';
import {MATERIALS} from '../../supabase/functions/_shared/world-planner';
import type {Building,MaterialAssignment,WorldQuote} from '../../supabase/functions/_shared/world-types';
import {useTouchTools} from './useTouchTools';
import {useWorldUI} from './useWorldUI';
const surfaces: [MaterialAssignment['surface'],string,string][]=[['walls','الجدران','Walls'],['roof','السقف','Roof'],['floor','الأرضية','Floor'],['doors','الأبواب','Doors'],['windows','النوافذ','Windows'],['stairs','الدرج','Stairs']];
/** Local, free visual fitting. Only Review hands a request to the existing server
 * quote/commit flow; client estimates never settle or change saved entities. */
export function FinishStudio({building:b,busy,onReview,onClose}:{building:Building;busy:boolean;onReview:(request:Record<string,unknown>)=>void;onClose:()=>void}){
 const {state,online}=useGame(),{t,language}=useLocale(),{format}=useMoney();
 const [surface,setSurface]=useState<MaterialAssignment['surface']>('walls'),[material,setMaterial]=useState('plaster'),[quality,setQuality]=useState(1),[floor,setFloor]=useState<number|null>(null);
 const context=useMemo(()=>state?viewWorldContext(state):null,[state]);
 const request=useMemo(()=>({building_id:b.id,surface,material,quality,floor}),[b.id,surface,material,quality,floor]);
 const fitting=useMemo(()=>{if(!context)return {quote:null,error:''};try{return {quote:worldTransition(context,'world_quote',{operation:'material_apply',request:{realm:b.realm,...request},expected_revision:context.world.revision}).quote,error:''};}catch(cause){return {quote:null,error:localizeError(cause,language)};}},[context,request,b.realm,language]);
 useEffect(()=>{useTouchTools.getState().set({designOpen:true});return()=>useTouchTools.getState().set({finishPreview:null,designOpen:false});},[]);
 useEffect(()=>{useTouchTools.getState().set({finishPreview:fitting.quote});},[fitting.quote]);
 useEffect(()=>{useWorldUI.getState().set({selected:b.id,inspectFocus:true,floor:surface==='floor'||surface==='stairs'?floor??b.floors[0]?.index??0:null});},[b.id,b.floors,surface,floor]);
 useEffect(()=>{const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'&&!busy){event.preventDefault();onClose();}};document.addEventListener('keydown',escape);return()=>document.removeEventListener('keydown',escape);},[busy,onClose]);
 const sum=(q:WorldQuote|null)=>q?.patch.bill.reduce((n,l)=>n+amount(l.paid),0n)??0n;
 const refund=fitting.quote?.refunds.reduce((n,l)=>n+amount(l.amount),0n)??0n;
 return <section aria-busy={busy} className="finish-studio" data-testid="finish-studio" aria-label={t('استوديو تشطيب المبنى','Building finish studio')}>
  <header><div><small>{t('وضع التصميم · معاينة حية','DESIGN MODE · LIVE FITTING')}</small><h2>{b.name}</h2></div><button aria-label={t('إلغاء معاينة التشطيب','Cancel finish preview')} onClick={onClose} disabled={busy}>×</button></header>
  <div className="finish-surfaces" role="group" aria-label={t('السطح','Surface')}>{surfaces.map(([id,ar,en])=><button key={id} disabled={busy} aria-pressed={surface===id} data-testid={'finish-surface-'+id} onClick={()=>{setSurface(id);if(id==='roof'||id==='doors')setFloor(null);}}>{t(ar,en)}</button>)}</div>
  <div className="finish-options"><label>{t('الطابق','Floor')}<select aria-label={t('الطابق','Floor')} disabled={busy||surface==='roof'||surface==='doors'} value={floor??'all'} onChange={e=>setFloor(e.target.value==='all'?null:Number(e.target.value))}><option value="all">{t('كل الطوابق','All floors')}</option>{b.floors.filter(f=>b.stages.some(s=>s.type==='floor'&&s.floor===f.index&&s.paid)).map(f=><option key={f.index} value={f.index}>{f.index}</option>)}</select></label><label>{t('الجودة','Quality')}<select disabled={busy} aria-label={t('الجودة','Quality')} value={quality} onChange={e=>setQuality(Number(e.target.value))}><option value="1">{t('قياسي','Standard')}</option><option value="2">{t('فاخر ×٢','Premium ×2')}</option><option value="3">{t('ممتاز ×٣','Signature ×3')}</option></select></label></div>
  <div className="finish-materials" role="group" aria-label={t('الخامات','Materials')}>{MATERIALS.map(m=><button key={m.id} disabled={busy} data-testid={'finish-material-'+m.id} aria-pressed={material===m.id} onClick={()=>setMaterial(m.id)}><AssetThumbnail assetKey={'material:'+m.id}/><span>{t(m.ar,m.en)}</span></button>)}</div>
  <footer><div role="status">{fitting.error||<><small>{t('خصم بعد التأكيد فقط','Charged only after confirmation')}</small><strong data-testid="finish-cost">{format(money(sum(fitting.quote)),b.realm,b.realm==='yuyi')}</strong>{refund>0n&&<small>{t('استرداد التشطيب السابق ٥٠٪','50% previous finish refund')}: {format(money(refund),b.realm,b.realm==='yuyi')}</small>}</>}</div><button data-testid="finish-review" disabled={!online||busy||!fitting.quote||!!fitting.error} onClick={()=>onReview(request)}>{t('مراجعة السعر','Review price')}</button></footer>
 </section>;
}
