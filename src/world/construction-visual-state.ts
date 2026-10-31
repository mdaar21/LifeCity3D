import type {Building} from '../../supabase/functions/_shared/world-types';
export function constructionVisualState(b:Building){
 const paidFloors=b.floors.filter(f=>b.stages.some(s=>s.type==='floor'&&s.floor===f.index&&s.paid));
 return {paidFloors,frame:b.stages.some(s=>s.type==='frame'&&s.paid),roof:b.stages.some(s=>s.type==='roof'&&s.paid),finished:b.stages.some(s=>s.type==='finish'&&s.paid),active:!b.opened_at,height:Math.max(3,...b.floors.filter(f=>f.index>=0).map(f=>(f.index+1)*3))};
}
