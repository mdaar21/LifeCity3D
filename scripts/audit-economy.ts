import {mkdir,writeFile} from 'node:fs/promises';
import {createLocalDatabase} from '../server/database';
import {createPlayer,state} from '../tests/integration/fixtures';
import {BUILDING_CATALOG,isTower} from '../supabase/functions/_shared/building-catalog';
import {CARS} from '../supabase/functions/_shared/world-motion';
import {FURNITURE} from '../supabase/functions/_shared/world-commerce';
import {VEGETATION,FARM_PLOTS,CROPS} from '../supabase/functions/_shared/world-horticulture';
import {NODE_CATALOG,DECORATIONS} from '../supabase/functions/_shared/world-infrastructure';
import {generatePlans,defaultRooms,constructionPricing} from '../supabase/functions/_shared/world-planner';
import {amount,money} from '../supabase/functions/_shared/world-math';
import type {Archetype} from '../supabase/functions/_shared/world-types';
function buildingOffer(id:Archetype,floors:number){const item=BUILDING_CATALOG[id],plans=generatePlans({...item,floors,rooms:defaultRooms(id),accessible:floors>3,archetype:id,budget:'1000000000'},{x:0,z:0,width:64,depth:64}),pricing=constructionPricing(item.width,item.depth,plans,'moss',id);return {pricing,total:pricing.total,foundation:money(amount(pricing.components.survey)+amount(pricing.components.foundation))};}
import {XP_LEVEL_UNIT} from '../supabase/functions/_shared/product-unlocks';
const db=await createLocalDatabase({path:'memory://'});
try{
 const player=await createPlayer(db,'economy-audit'),s=await state(db,player.id),approved=(await db.owner(tx=>tx.query<{slug:string;reward:number;cadence:string}>('select slug,reward,cadence from public.approved_task_catalog'))).rows;
 const award=(slug:string)=>approved.find(t=>t.slug===slug)!.reward,base=(slug:string)=>s.tasks.find(t=>t.key===slug)!.reward;
 const scenarios=[
 {id:'low',base:base('make_bed'),tasks:['wash_dishes','tidy_desk'],laundry:0,study:20,prayer:50,fullPrayer:false,weekly:0},
 {id:'medium',base:base('make_bed')+base('clean_room'),tasks:['wash_dishes','tidy_desk','take_out_trash','help_family','morning_adhkar','evening_adhkar','walk_20_minutes'],laundry:1,study:60,prayer:110,fullPrayer:true,weekly:award('wash_car')+award('all_weekly_goals')},
 {id:'high',base:s.tasks.reduce((n,t)=>n+t.reward,0),tasks:approved.filter(t=>t.cadence==='daily').map(t=>t.slug),laundry:3,study:180,prayer:110,fullPrayer:true,weekly:award('wash_car')+award('all_weekly_goals')+award('study_20_hours_week')}
 ].map(p=>{const taskIncome=p.base+p.tasks.reduce((n,k)=>n+award(k),0)+p.laundry*award('laundry_load'),study=p.study+(p.study>=60?20:0),daily=taskIncome+study+p.prayer+(p.fullPrayer?50:0)+award('five_tasks_day');return {...p,taskIncome,studyIncome:study,daily,week:daily*7+p.weekly,month30:daily*30+p.weekly*30/7+award('commitment_30_days'),daysToLevel40:38025/(daily+p.weekly/7+500/30)};});
 const cents=(prefix:string,items:readonly {id:string;price:number}[])=>items.map(i=>({id:prefix+':'+i.id,price:i.price/100}));
 const purchases=[...s.catalog.map(i=>({id:'legacy:'+i.id,price:i.price})),...Object.keys(BUILDING_CATALOG).map(id=>({id:'building:'+id,price:Number(buildingOffer(id as keyof typeof BUILDING_CATALOG,isTower(id)?38:1).total)})),...cents('car',CARS),...cents('furniture',FURNITURE),...cents('vegetation',VEGETATION),...cents('farm',FARM_PLOTS),...cents('node',NODE_CATALOG),...cents('decoration',DECORATIONS),...CROPS.map(c=>({id:'crop:'+c.id,price:(c.seed+c.waterings*50+50)/100}))].map(p=>({...p,savingDays:Object.fromEntries(scenarios.map(s=>[s.id,Math.round(p.price/s.daily*10)/10]))}));
 const phases=Object.keys(BUILDING_CATALOG).map(id=>{const offer=buildingOffer(id as keyof typeof BUILDING_CATALOG,isTower(id)?38:1);return {id,total:offer.total,foundation:offer.foundation,components:offer.pricing.components,towerExtraFloor:offer.pricing.tower_floor_price??null};});
 const report={source:'Actual migrated disposable PostgreSQL reward catalog and shared canonical price engine',assumptions:['All activities must actually occur; scenario budgets are gross saving-only, not guaranteed earnings.','Low: two completed prayers +three tasks +20 verified study minutes; derived daily5 includes prayer/study events.','Medium: two base tasks, seven approved daily tasks, one laundry,60 verified minutes, all prayers; one50 car wash and200 committed weekly goals.','High: three base tasks, ten daily approved tasks, three laundry loads,180 verified minutes; meets1200 weekly study minutes.','One study session/day. Multiple verified60min sessions may add more first-hour bonuses.','No custom tasks, partner/manual grants, farm/business income or missed-prayer penalties assumed. Passive income shares a20%/60SAR24h cap and requires purchased assets.','Monthly values use30/7 weekly cycles and exactly one earned30-day500 award; actual calendar periods vary.','Laundry cap remains3/day; daily and weekly claim uniqueness, prayer reversals, 90s unverified-gap cap and exact half refunds are unchanged.'],xp:{unit:XP_LEVEL_UNIT,max:40,requiredAt40:1521*XP_LEVEL_UNIT,noXpRewrite:true},scenarios,purchases,phases};
 await mkdir('docs/evidence/comprehensive-upgrade',{recursive:true});await writeFile('docs/evidence/comprehensive-upgrade/economy-audit.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({scenarios:scenarios.map(({id,daily,week,month30})=>({id,daily,week,month30})),products:purchases.length}));
}finally{await db.close();}
