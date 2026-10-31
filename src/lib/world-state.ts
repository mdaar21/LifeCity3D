import type {GameSnapshot} from './types';
import type {WorldContext} from '../../supabase/functions/_shared/world-types';
import {emptyWorld} from '../../supabase/functions/_shared/world-engine';
/** View/explicit guest context only. Production commands construct this from private SQL. */
export function viewWorldContext(s:GameSnapshot):WorldContext{
 const after=Date.parse(s.server_now)-86400000;
 const legitimate=(reason:string)=>/^task:(clean_room|make_bed|workout)$/.test(reason)||reason==='study:minutes'||/^prayer:(fajr|dhuhr|asr|maghrib|isha):(completed|correction)$/.test(reason)||!!s.approved_tasks?.catalog.some(t=>t.cadence!=='automatic'&&reason==='approved:'+t.slug);
 const fx=s.v6?.fx;
 return {user_id:s.profile.id,now:s.server_now,world:s.world_systems??emptyWorld(),balances:{MAIN:String(s.wallet.balance),YUYI_MAD:s.v6?.yuyi_wallet.balance??'0.0000'},fx:fx?{id:fx.id,rate_time:fx.rate_time,mad_rate:fx.mad_rate,display_rate:fx.display_rate,currency:s.v6?.display_currency??'SAR'}:null,
 legacy_sizes:{main:s.world.size,yuyi:s.v6?.yuyi_world.size??s.world.size},legacy_versions:{main:s.world.version,yuyi:s.v6?.yuyi_world.version??0},
 legacy:([['main',s.placements],['yuyi',s.v6?.yuyi_placements??[]]] as const).flatMap(([realm,list])=>list.map(v=>{const item=s.catalog.find(c=>c.id===v.catalog_id);return {realm,id:v.id,catalog_id:v.catalog_id,rotation:v.rotation,x:v.x,z:v.z,width:(v.rotation%180?item?.footprint_z:item?.footprint_x)??1,depth:(v.rotation%180?item?.footprint_x:item?.footprint_z)??1};})),
 eligible_income:String(Math.max(0,s.ledger.filter(v=>Date.parse(v.created_at)>after&&legitimate(v.reason)&&(!v.reason.endsWith(':correction')||v.delta<0)).reduce((a,v)=>a+v.delta,0))),income_paid:String(s.ledger.filter(v=>Date.parse(v.created_at)>after&&v.reason==='world:business_income').reduce((a,v)=>a+v.delta,0)),
 legitimate_minutes:s.study_sessions.reduce((a,v)=>a+v.credited_minutes,0),legitimate_actions:s.completions.filter(v=>s.tasks.some(t=>t.id===v.task_id&&['clean_room','make_bed','workout'].includes(t.key??''))).length+s.prayers.filter(v=>v.status==='completed').length+(s.approved_tasks?.claims.filter(v=>s.approved_tasks!.catalog.some(t=>t.slug===v.slug&&t.cadence!=='automatic')).length??0),milestones:s.approved_tasks?.claims.filter(v=>s.approved_tasks!.catalog.some(t=>t.slug===v.slug&&t.cadence==='automatic')).map(v=>v.slug)??[],receipt:null};
}
