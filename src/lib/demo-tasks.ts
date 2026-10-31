/** Explicit local guest simulation; authenticated awards always run in Postgres. */
import type {CommandResponse,GameSnapshot,StudySession} from './types';
import type {ApprovedTasks} from './task-types';
import {APPROVED_TASKS,addDays,weekOf,zonedMidnight} from './approved-tasks';
import {localDay} from './rules';
import {ApiError} from './errors';
interface Event {slug:string;id:string;day:string;week:string;at:string}
interface Minute {session:string;ordinal:number;day:string;week:string;at:string}
interface Segment {session:string;start:string;end:string;day:string;week:string}
interface GuestTasks extends ApprovedTasks {_guest:{events:Event[];minutes:Minute[];segments:Segment[];plans:NonNullable<ApprovedTasks['weekly_plan']>[];days:{day:string;streak_id:string;streak_day:number}[];enrolled_at:string}}
const uid=()=>crypto.randomUUID();
export function upgradeGuestTasks(s:GameSnapshot,now=new Date()):GuestTasks{
 if(!s.approved_tasks){const timezone=s.profile.timezone,day=localDay(now,timezone);s.approved_tasks={version:1,catalog:APPROVED_TASKS,calendar:{calendar_id:uid(),timezone,week_start:0,day,week:weekOf(day),paused:false,day_ends_at:zonedMidnight(addDays(day,1),timezone),week_ends_at:zonedMidnight(addDays(weekOf(day),7),timezone)},claims:[],laundry_daily_limit:3,distinct_today:0,study_minutes_week:0,weekly_plan:null,wake_targets:[],pending_calendar:null,commitment:null,_guest:{events:[],minutes:[],segments:[],plans:[],days:[],enrolled_at:now.toISOString()}} as GuestTasks;}
 const a=s.approved_tasks as GuestTasks;a._guest.segments??=[];a._guest.plans??=[];const day=localDay(now,a.calendar.timezone),week=weekOf(day,a.calendar.week_start);Object.assign(a.calendar,{day,week,day_ends_at:zonedMidnight(addDays(day,1),a.calendar.timezone),week_ends_at:zonedMidnight(addDays(week,7),a.calendar.timezone)});
 a.distinct_today=new Set(a._guest.events.filter(x=>x.day===day&&(!x.slug.startsWith('prayer_')||s.prayers.some(p=>p.day===day&&'prayer_'+p.prayer===x.slug&&p.status==='completed'))).map(x=>x.slug)).size;a.study_minutes_week=Math.floor(a._guest.segments.filter(x=>x.week===week).reduce((n,x)=>n+Date.parse(x.end)-Date.parse(x.start),0)/60000);
 if(a.weekly_plan&&!a._guest.plans.some(x=>x.id===a.weekly_plan!.id))a._guest.plans.push(a.weekly_plan);a.weekly_plan=a._guest.plans.find(x=>x.local_week===week)??null;if(a.weekly_plan)for(const g of a.weekly_plan.goals)g.progress=progress(a,g.slug,a.weekly_plan.created_at,week);
 a.wake_targets=a.wake_targets.filter(x=>x.local_day>=day);const last=a._guest.days.at(-1);a.commitment=last?{...last,local_day:last.day,current:last.day>=addDays(day,-1)}:null;return a;
}
function progress(a:GuestTasks,slug:string,since:string,week:string){return slug==='study_minutes'?Math.floor(a._guest.segments.filter(x=>x.week===week&&x.end>=since).reduce((n,x)=>n+Date.parse(x.end)-Math.max(Date.parse(x.start),since?Date.parse(since):0),0)/60000):a._guest.events.filter(x=>x.week===week&&x.at>=since&&x.slug===slug).length;}
function post(s:GameSnapshot,a:GuestTasks,slug:string,key:string,evidence:Record<string,unknown>,request:string,day=a.calendar.day,week=a.calendar.week){
 if(a.claims.some(x=>x.slug===slug&&x.claim_key===key))return null;const task=APPROVED_TASKS.find(x=>x.slug===slug)!;const id=uid(),ledgerId=uid(),now=new Date().toISOString();
 s.wallet.balance+=task.reward;s.wallet.player_xp+=task.reward;s.ledger.unshift({id:ledgerId,delta:task.reward,reason:'approved:'+slug,actor_id:s.profile.id,created_at:now,idempotency_key:request+':approved:'+id});
 a.claims.unshift({id,slug,version:1,claim_key:key,local_day:day,local_week:week,reward:task.reward,evidence,ledger_id:ledgerId,created_at:now,fx_id:null});return id;
}
function reconcile(s:GameSnapshot,key:string){
 const a=upgradeGuestTasks(s),d=a.calendar.day;const recent=[addDays(d,-1),d];
 for(const day of recent){const events=a._guest.events.filter(x=>x.day===day&&(!x.slug.startsWith('prayer_')||s.prayers.some(p=>p.day===day&&'prayer_'+p.prayer===x.slug&&p.status==='completed')));if(new Set(events.map(x=>x.slug)).size>=5)post(s,a,'five_tasks_day','d:'+day,{type:'derived_distinct_base_tasks'},key,day,weekOf(day));
  if(a._guest.days.some(x=>x.day>=day))continue;if(!events.some(x=>x.slug!=='study_completed')&&a._guest.segments.filter(x=>x.day===day).reduce((n,x)=>n+Date.parse(x.end)-Date.parse(x.start),0)<1200000)continue;
  const last=a._guest.days.at(-1);const streak_id=last?.day===addDays(day,-1)?last.streak_id:uid(),streak_day=last?.day===addDays(day,-1)?last.streak_day+1:1;a._guest.days.push({day,streak_id,streak_day});
  if(streak_day%30===0)post(s,a,'commitment_30_days',`s:${streak_id}:${streak_day/30}`,{type:'commitment',streak_id,day:streak_day},key,day,weekOf(day));
 }
 for(const week of [addDays(a.calendar.week,-7),a.calendar.week])if(a._guest.segments.filter(x=>x.week===week).reduce((n,x)=>n+Date.parse(x.end)-Date.parse(x.start),0)>=72000000)post(s,a,'study_20_hours_week','w:'+week,{type:'verified_study_minutes',minutes:1200},key,d,week);
 if(a.weekly_plan&&a.weekly_plan.goals.every(g=>progress(a,g.slug,a.weekly_plan!.created_at,a.calendar.week)>=g.target))post(s,a,'all_weekly_goals','w:'+a.calendar.week,{type:'immutable_weekly_plan',plan_id:a.weekly_plan.id},key);
 upgradeGuestTasks(s);
}
export function guestTaskCommand(s:GameSnapshot,action:string,p:Record<string,unknown>,key:string):CommandResponse|null{
 const a=upgradeGuestTasks(s),day=a.calendar.day,week=a.calendar.week;const e=(p.evidence??{}) as Record<string,unknown>;
 if(action==='approved_task_claim'){
  const task=APPROVED_TASKS.find(x=>x.slug===p.slug);if(!task||task.cadence==='automatic')throw new ApiError('TASK_NOT_CLAIMABLE');if(p.self_reported!==true)throw new ApiError('SELF_REPORT_REQUIRED');
  let claimKey=(task.cadence==='weekly'?'w:'+week:'d:'+day);
  if(task.slug==='laundry_load'){if(typeof e.load_id!=='string'||!/^[0-9a-f-]{36}$/.test(e.load_id))throw new ApiError('INVALID_PAYLOAD');claimKey='load:'+e.load_id;if(a.claims.some(x=>x.slug===task.slug&&x.claim_key===claimKey))throw new ApiError('ALREADY_CLAIMED');if(a.claims.filter(x=>x.slug===task.slug&&x.local_day===day).length>=a.laundry_daily_limit)throw new ApiError('LAUNDRY_LIMIT');}
  if(['walk_20_minutes','social_media_free_hour'].includes(task.slug)){if(typeof e.minutes!=='number'||!Number.isInteger(e.minutes)||e.minutes<(task.slug==='walk_20_minutes'?20:60)||e.minutes>1440)throw new ApiError('INVALID_PAYLOAD');}
  if(task.slug==='sleep_7_hours'){const b=Date.parse(String(e.bedtime)),z=Date.parse(String(e.wake_time));if(!Number.isFinite(b)||!Number.isFinite(z)||z-b<7*3600000||z-b>16*3600000||z>Date.now()||localDay(new Date(z),a.calendar.timezone)!==day)throw new ApiError('INVALID_SLEEP_INTERVAL');if(a.claims.some(x=>x.slug==='sleep_7_hours'&&b<Date.parse(String(x.evidence.wake_time))&&z>Date.parse(String(x.evidence.bedtime))))throw new ApiError('SLEEP_OVERLAP');}
  if(task.slug==='wake_on_time'){const target=a.wake_targets.find(x=>x.local_day===day),at=Date.parse(String(e.wake_time));if(!target||!Number.isFinite(at)||at>Date.now()||at>Date.parse(target.target_at)+600000||localDay(new Date(at),a.calendar.timezone)!==day)throw new ApiError('WAKE_TARGET_NOT_MET');}
  const id=post(s,a,task.slug,claimKey,{...e,type:'self_reported'},key);if(!id)throw new ApiError('ALREADY_CLAIMED');a._guest.events.push({id,slug:task.slug,day,week,at:new Date().toISOString()});reconcile(s,key);return {state:s,result:{claim_id:id,reward:task.reward,wallet:'MAIN',verification:'self_reported'}};
 }
 if(action==='wake_target_set'){const date=String(p.day),time=String(p.time);if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||date<=day||date>addDays(day,7)||!/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(time))throw new ApiError('WAKE_TARGET_IN_ADVANCE');if(a.wake_targets.some(x=>x.local_day===date))throw new ApiError('WAKE_TARGET_LOCKED');const target_at=zonedMidnight(date,a.calendar.timezone,time+':00');const id=uid();a.wake_targets.push({id,local_day:date,target_at,grace_minutes:10});return {state:s,result:{target_id:id}};}
 if(action==='weekly_plan_start'){if(a.weekly_plan)throw new ApiError('PLAN_LOCKED');const goals=p.goals as {slug:string;target:number}[];if(!Array.isArray(goals)||goals.length<3||goals.length>12)throw new ApiError('THREE_GOALS_REQUIRED');if(new Set(goals.map(x=>x.slug)).size!==goals.length)throw new ApiError('INVALID_WEEKLY_GOAL');for(const g of goals){if(![...APPROVED_TASKS.filter(x=>x.cadence!=='automatic').map(x=>x.slug),'clean_room','make_bed','workout','study_minutes'].includes(g.slug)||!Number.isInteger(g.target)||g.target<(g.slug==='study_minutes'?20:1)||g.target>(g.slug==='study_minutes'?1200:7))throw new ApiError('INVALID_WEEKLY_GOAL');if(g.slug==='wash_car'&&g.target!==1)throw new ApiError('INVALID_WEEKLY_GOAL');if(progress(a,g.slug,'',week)>=g.target)throw new ApiError('GOAL_ALREADY_ACCOMPLISHED');}a.weekly_plan={id:uid(),local_week:week,created_at:new Date().toISOString(),goals:goals.map(x=>({...x,progress:0}))};return {state:s,result:{plan_id:a.weekly_plan.id,immutable:true}};}
 if(action==='task_reconcile'){reconcile(s,key);return {state:s,result:{reconciled:true}};}
 return null;
}
export function observeGuestTasks(s:GameSnapshot,action:string,p:Record<string,unknown>,key:string,oldSessions:StudySession[],oldPrayerStatus?:string){
 const a=upgradeGuestTasks(s),day=a.calendar.day,week=a.calendar.week;let slug:string|null=null;
 if(action==='task_complete')slug=s.tasks.find(x=>x.id===p.task_id&&['clean_room','make_bed','workout'].includes(x.key??''))?.key??null;
 if(action==='prayer_set'&&p.status==='completed'&&oldPrayerStatus!=='completed'&&(!p.day||p.day===day))slug='prayer_'+p.prayer;
 if(action.startsWith('study_')){
  for(const old of oldSessions){const next=s.study_sessions.find(x=>x.id===old.id);if(!next||old.status!=='running')continue;
   let cursor=Math.max(Date.parse(old.last_tick_at),Date.parse(a._guest.enrolled_at));const end=Date.parse(old.last_tick_at)+Math.max(0,next.active_seconds-old.active_seconds)*1000;
   while(cursor<end){const day=localDay(new Date(cursor),a.calendar.timezone),partEnd=Math.min(end,Date.parse(zonedMidnight(addDays(day,1),a.calendar.timezone)));const start=new Date(cursor).toISOString();if(!a._guest.segments.some(x=>x.session===old.id&&x.start===start))a._guest.segments.push({session:old.id,start,end:new Date(partEnd).toISOString(),day,week:weekOf(day)});cursor=partEnd;}
   for(let k=old.credited_minutes+1;k<=next.credited_minutes;k++){const at=new Date(Date.parse(old.last_tick_at)+(k*60-old.active_seconds)*1000);if(at.toISOString()<a._guest.enrolled_at)continue;const d=localDay(at,a.calendar.timezone);if(!a._guest.minutes.some(x=>x.session===old.id&&x.ordinal===k))a._guest.minutes.push({session:old.id,ordinal:k,day:d,week:weekOf(d),at:at.toISOString()});}}
  if(action==='study_finish'&&a._guest.minutes.some(x=>x.session===p.session_id))slug='study_completed';
 }
 if(slug){const id=slug==='study_completed'?'study:'+p.session_id:slug.startsWith('prayer_')?slug+':'+day:key;if(!a._guest.events.some(x=>x.id===id))a._guest.events.push({slug,id,day,week,at:new Date().toISOString()});}
 reconcile(s,key);
}
