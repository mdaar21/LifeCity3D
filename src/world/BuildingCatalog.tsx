import type {ReactNode} from 'react';
import {ProductCard} from '../components/ProductCard';
import {AccessLabel,useProductGate} from '../components/ProductAccess';
import {useMemo} from 'react';
import {useLocale} from '../lib/locale';
import {useMoney} from '../lib/useMoney';
import {BUILDING_CATALOG,isTower} from '../../supabase/functions/_shared/building-catalog';
import {constructionPricing,constructionQuotedTotals,defaultRooms,generatePlans} from '../../supabase/functions/_shared/world-planner';
import {amount,money} from '../../supabase/functions/_shared/world-math';
import type {Archetype,Realm} from '../../supabase/functions/_shared/world-types';

export function buildingOffer(id:Archetype,floors:number,style:'forest'|'coastal'|'desert'='forest'){
 floors=isTower(id)?Math.max(38,floors):Math.min(12,floors);const item=BUILDING_CATALOG[id],plans=generatePlans({...item,floors,style,rooms:defaultRooms(id),accessible:floors>3,archetype:id,budget:'1000000000'},{x:0,z:0,width:64,depth:64});
 const pricing=constructionPricing(item.width,item.depth,plans,'moss',id);
 return {...item,floors,pricing,total:pricing.total,foundation:money(amount(pricing.components.survey)+amount(pricing.components.foundation))};
}
export function BuildingCatalog({floors,realm,query,busy,onSelect,style='forest',legacyProducts}:{floors:number;style?:'forest'|'coastal'|'desert';realm:Realm;query:string;busy:boolean;onSelect:(id:Archetype)=>void;legacyProducts?:ReactNode}){
 const {t}=useLocale(),{format,fx}=useMoney(),gate=useProductGate();
 const offers=useMemo(()=>Object.keys(BUILDING_CATALOG).map(id=>({id:id as Archetype,...buildingOffer(id as Archetype,floors,style)})),[floors,style]);
 return <>{gate.modal}<div className="unified-product-grid" data-testid="unified-product-grid">{legacyProducts}{offers.filter(item=>!query||(item.ar+' '+item.en).toLowerCase().includes(query.toLowerCase())).map(item=>{const price=constructionQuotedTotals(item.pricing,realm==='yuyi'?fx?.mad_rate:undefined),choose=()=>gate.guard('building:'+item.id,t(item.ar,item.en),'building:'+item.id,()=>onSelect(item.id));return <ProductCard key={item.id} className="building-card" title={t(item.ar,item.en)} asset={'building:'+item.id} style={style} badge={<AccessLabel product={'building:'+item.id} level={gate.level}/>} price={<span data-testid={'building-total-'+item.id}>{format(price.total,realm,realm==='yuyi'&&!!fx)}</span>} caption={t('بناء على مراحل · السعر الكامل','Staged construction · complete price')} meta={<><span dir="ltr">{item.width} × {item.depth} m · {item.floors} {t('طابق','floor(s)')}</span><span>{t('الأساس أولًا: ','Foundation first: ')}{format(price.foundation,realm,realm==='yuyi'&&!!fx)}</span></>} action={gate.locked('building:'+item.id)?t('معاينة المبنى المقفل','Preview locked building'):t('معاينة البناء','Preview construction')} locked={gate.locked('building:'+item.id)} testId={'touch-build-'+item.id} disabled={busy} onAction={choose} onPreview={choose}/>;})}</div><p className="catalog-note">{t('الأسعار الكاملة حسب النوع والحجم والطوابق. تدفع كل مرحلة بعد تأكيدها؛ الأرض والأثاث والتخصيص إضافية.','Complete prices reflect type, size and floors. Confirm and pay each stage separately; land, furniture and custom finishes are additional.')}</p></>;
}
