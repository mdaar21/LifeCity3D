import {Users,Flag,Building2,Trees,Route} from 'lucide-react';
import {useGame} from '../lib/game';
import {useLocale} from '../lib/locale';
import {useTerritory} from '../lib/useTerritory';
/** Progress follows real purchases and openings. This display never creates rewards. */
export function CityLifeSummary(){
 const {state}=useGame(),{realm}=useTerritory(),{t,number}=useLocale();
 if(!state)return null;
 const entities=state.world_systems?.entities.filter(e=>e.realm===realm&&e.status==='active')??[],legacy=realm==='main'?state.placements:state.v6?.yuyi_placements??[];
 const homes=entities.filter(e=>e.kind==='building'&&['house','villa'].includes(e.archetype)&&e.opened_at).length+legacy.filter(e=>['house','villa','apartment','palace'].includes(e.catalog_id)).length;
 const roads=entities.some(e=>e.kind==='edge'&&e.network==='road')||legacy.some(e=>['road','path'].includes(e.catalog_id));
 const greenery=entities.some(e=>e.kind==='decoration')||legacy.some(e=>['tree','palm','park','bush','flower'].includes(e.catalog_id));
 const services=entities.some(e=>e.kind==='building'&&e.opened_at&&['school','clinic','hospital'].includes(e.archetype));
 const goals=[{done:homes>0,ar:'أكمل أول منزل لاستقبال ساكنك',en:'Complete a home to welcome a resident',icon:Building2},{done:roads,ar:'اربط الحي بطريق',en:'Connect the neighborhood with a road',icon:Route},{done:greenery,ar:'زيّن حيّك بالطبيعة',en:'Bring greenery to the neighborhood',icon:Trees},{done:services,ar:'جهّز مدرسة أو خدمة صحية',en:'Open a school or healthcare service',icon:Flag}];
 const next=goals.find(g=>!g.done),Icon=next?.icon??Flag;
 return <aside className="city-management-summary" data-testid="city-life-summary"><div><Users size={18}/><strong data-testid="city-population">{number(homes)}</strong><span>{t('سكّان المدينة','City residents')}</span></div><p><Icon size={16}/>{next?t(next.ar,next.en):t('حي متكامل — طوّر حيّك القادم','Neighborhood complete — grow your next district')}</p><progress value={goals.filter(g=>g.done).length} max={goals.length} aria-label={t('تقدم الحي','Neighborhood progress')}/><small>{t('أنجز مهام حياتك لتمويل الخطوة التالية','Complete real-life tasks to fund your next step')}</small></aside>;
}
