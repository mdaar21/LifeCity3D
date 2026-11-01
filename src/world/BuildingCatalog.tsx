import {useMemo} from 'react';
import {AssetThumbnail} from '../components/AssetThumbnail';
import {useLocale} from '../lib/locale';
import {useMoney} from '../lib/useMoney';
import {BUILDING_CATALOG,BUILDING_GROUPS} from '../../supabase/functions/_shared/building-catalog';
import {constructionPricing,constructionQuotedTotals,defaultRooms,generatePlans} from '../../supabase/functions/_shared/world-planner';
import {amount,money} from '../../supabase/functions/_shared/world-math';
import type {Archetype,Realm} from '../../supabase/functions/_shared/world-types';

export function buildingOffer(id:Archetype,floors:number){
 const item=BUILDING_CATALOG[id],plans=generatePlans({...item,floors,rooms:defaultRooms(id),accessible:false,archetype:id,budget:'10000000'},{x:0,z:0,width:64,depth:64});
 const pricing=constructionPricing(item.width,item.depth,plans,'moss',id);
 return {...item,pricing,total:pricing.total,foundation:money(amount(pricing.components.survey)+amount(pricing.components.foundation))};
}
export function BuildingCatalog({floors,realm,query,busy,onSelect}:{floors:number;realm:Realm;query:string;busy:boolean;onSelect:(id:Archetype)=>void}){
 const {t}=useLocale(),{format,fx}=useMoney();
 const offers=useMemo(()=>Object.keys(BUILDING_CATALOG).map(id=>({id:id as Archetype,...buildingOffer(id as Archetype,floors)})),[floors]);
 return <div className="building-collection">{BUILDING_GROUPS.map(group=>{
  const items=offers.filter(item=>item.group===group.id&&(!query||(item.ar+' '+item.en).toLowerCase().includes(query.toLowerCase())));
  return items.length?<section className="building-family" key={group.id}><h3>{t(group.ar,group.en)}</h3><div className="touch-cards building-cards">{items.map(item=>{const price=constructionQuotedTotals(item.pricing,realm==='yuyi'?fx?.mad_rate:undefined);return <button className="building-card" data-testid={'touch-build-'+item.id} key={item.id} disabled={busy} onClick={()=>onSelect(item.id)}>
   <AssetThumbnail assetKey={'building:'+item.id}/><strong>{t(item.ar,item.en)}</strong>
   <span className="building-total" data-testid={'building-total-'+item.id}>{format(price.total,realm,realm==='yuyi'&&!!fx)}</span><small>{t('إجمالي البناء الأساسي','Complete basic construction')}</small>
   <span className="building-spec" dir="ltr">{item.width} × {item.depth} m · {floors} {t('طابق','floor(s)')}</span><span className="building-deposit">{t('الأساس أولًا: ','Foundation first: ')}{format(price.foundation,realm,realm==='yuyi'&&!!fx)}</span>
  </button>;})}</div></section>:null;
 })}<p className="catalog-note">{t('الأسعار الكاملة حسب النوع والحجم والطوابق. تدفع كل مرحلة بعد تأكيدها؛ الأرض والأثاث والتخصيص إضافية.','Complete prices reflect type, size and floors. Confirm and pay each stage separately; land, furniture and custom finishes are additional.')}</p></div>;
}
