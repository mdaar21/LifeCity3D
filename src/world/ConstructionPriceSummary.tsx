import {useLocale} from '../lib/locale';
import {useMoney} from '../lib/useMoney';
import {constructionQuotedTotals} from '../../supabase/functions/_shared/world-planner';
import type {WorldQuote} from '../../supabase/functions/_shared/world-types';
/** Same price explanation in beginner and advanced confirmations. */
export function ConstructionPriceSummary({quote}:{quote:WorldQuote}){
 const {t}=useLocale(),{format,fx}=useMoney();
 if(quote.action!=='building_start')return null;
 const b=quote.patch.upsert.find(e=>e.kind==='building');if(b?.kind!=='building'||!b.pricing)return null;
 const cost=constructionQuotedTotals(b.pricing,quote.realm==='yuyi'?fx?.mad_rate:undefined);
 return <div className="construction-price-summary"><span>{t('إجمالي البناء الأساسي كاملًا','Complete basic construction')}</span><strong data-testid="construction-contract-total">{format(cost.total,quote.realm,quote.realm==='yuyi'&&!!fx)}</strong><p>{t('المطلوب الآن دفعة الأساس فقط، ثم تؤكد كل مرحلة على حدة. الأرض والأثاث والتخصيص ليست ضمن هذا المبلغ.','Only the foundation deposit is due now; confirm each later stage separately. Land, furniture and custom finishes are additional.')}</p></div>;
}
