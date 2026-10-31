import {guestV6,upgradeGuest} from './demo-v6';
import {guestTaskCommand,observeGuestTasks,upgradeGuestTasks} from './demo-tasks';
/** Explicit single-browser guest preview. Never used for authenticated accounts. */
import {CATALOG} from './catalog';
import {ApiError} from './errors';
import {atomicRecord,readRecord,removeRecord,writeRecord} from './storage';
import {canPlace,levelFromXp,localDay,PRAYER_REWARDS} from './rules';
import type {CommandResponse,GameApi,GameSnapshot,Placement,Prayer,PrayerStatus,SessionUser} from './types';
interface DemoRecord {state:GameSnapshot;receipts:Record<string,{action:string;payload:string;result:Record<string,unknown>}>;ever_placed:string[];prayer_xp:string[]}
const KEY='guest-world-v1';const SESSION='guest-session-v1';
const uuid=()=>crypto.randomUUID();
function initial():DemoRecord {
 const id=uuid(),now=new Date().toISOString();
 return {receipts:{},ever_placed:[],prayer_xp:[],state:{profile:{id,display_name:'باني المدينة',language:'ar-SA',timezone:'Asia/Riyadh',theme:'light',digits:'latin',currency_label:'coins'},wallet:{balance:0,player_xp:0,city_xp:0},world:{id:uuid(),user_id:id,size:16,version:1},catalog:CATALOG,inventory:[],placements:[],furniture:[],tasks:[['clean_room','ترتيب الغرفة','Clean your room',40],['make_bed','ترتيب السرير','Make your bed',10],['workout','تمرين اليوم','Complete a workout',50]].map(([key,ar,en,reward])=>({id:uuid(),key:String(key),title:String(ar),title_ar:String(ar),title_en:String(en),reward:Number(reward),category:'daily',daily_limit:1,archived:false})),completions:[],prayers:[],study_sessions:[],ledger:[],partner_links:[],partner_permissions:[],partner_actions:[],partner_messages:[],partner_challenges:[],yuyi_memories:[],achievements:[],projects:[],city_share:null,preferences:{custom_reward_limit:500,task_daily_limit:1,prayer_reminders:false,audio:false,notifications:false},server_now:now,local_day:localDay(new Date(),'Asia/Riyadh')}};
}
function perform(record:DemoRecord,action:string,p:Record<string,unknown>,key:string):CommandResponse{
 const taskResult=guestTaskCommand(record.state,action,p,key);if(taskResult)return taskResult;
 const oldSessions=structuredClone(record.state.study_sessions),oldPrayerStatus=record.state.prayers.find(x=>x.prayer===p.prayer&&x.day===String(p.day??record.state.local_day))?.status;
 const special=guestV6(record.state,action,p,key,record.receipts);if(special)return special;
 const s=record.state,now=new Date(),iso=now.toISOString();s.projects??=[];s.city_share??=null;s.server_now=iso;s.local_day=localDay(now,s.profile.timezone);let result:Record<string,unknown>={};let entry=0;
 const integer=(v:unknown,min=0,max=100000)=>{if(typeof v!=='number'||!Number.isInteger(v)||v<min||v>max)throw new ApiError('INVALID_PAYLOAD');return v;};
 const coins=(delta:number,reason:string,xp=0)=>{s.wallet.balance+=delta;s.wallet.player_xp+=Math.max(0,xp);s.ledger.unshift({id:uuid(),delta,reason,actor_id:s.profile.id,created_at:iso,idempotency_key:key+':'+entry++});};
 const session=()=>{const v=s.study_sessions.find(v=>v.id===p.session_id);if(!v)throw new ApiError('NOT_FOUND');return v;};
 const tick=()=>{const v=session();if(v.status!=='running')return v;const gap=Math.max(0,(now.getTime()-new Date(v.last_tick_at).getTime())/1000);v.active_seconds+=Math.floor(Math.min(gap,90));v.last_tick_at=iso;if(gap>90){v.status='paused';v.idle_capped=true;}const minutes=Math.floor(v.active_seconds/60),credit=minutes-v.credited_minutes;if(credit>0){coins(credit,'study:minutes',credit);v.credited_minutes=minutes;}if(minutes>=60&&!v.bonus_awarded){coins(20,'study:bonus',20);v.bonus_awarded=true;}return v;};
 const place=(interior:boolean)=>{
  const inventory=s.inventory.find(v=>v.id===p.inventory_id);if(!inventory)throw new ApiError('NOT_FOUND');const item=CATALOG.find(v=>v.id===inventory.catalog_id)!;
  if(item.is_furniture!==interior)throw new ApiError('INVALID_PLACEMENT');
  if([...s.placements,...s.furniture].some(v=>v.inventory_id===inventory.id))throw new ApiError('CONFLICT');
  const house=interior?s.placements.find(v=>v.id===p.house_id&&['house','villa','apartment','palace'].includes(v.catalog_id)):null;if(interior&&!house)throw new ApiError('PERMISSION_DENIED');
  const x=integer(p.x),z=integer(p.z),rotation=integer(p.rotation,0,270);const list=interior?s.furniture.filter(v=>v.house_id===house?.id):s.placements;
  if(!canPlace(item,x,z,rotation,interior?8:s.world.size,list,CATALOG))throw new ApiError('INVALID_PLACEMENT');
  const v:Placement={id:uuid(),inventory_id:inventory.id,catalog_id:item.id,x,y:0,z,rotation,version:1,...(interior?{house_id:house!.id}:{world_id:s.world.id})};(interior?s.furniture:s.placements).push(v);s.world.version++;
  if(!record.ever_placed.includes(inventory.id)){record.ever_placed.push(inventory.id);inventory.first_placed_at=iso;s.wallet.city_xp+=Math.ceil(item.price/10);}result={placement_id:v.id};
 };
 if(action==='task_complete'){
  const task=s.tasks.find(v=>v.id===p.task_id&&!v.archived);if(!task)throw new ApiError('NOT_FOUND');
  const frequency=task.frequency??'daily';const day=new Date(s.local_day+'T12:00:00Z');const monday=new Date(day);monday.setUTCDate(day.getUTCDate()-(day.getUTCDay()+6)%7);const weekStart=monday.toISOString().slice(0,10);const sunday=new Date(monday);sunday.setUTCDate(monday.getUTCDate()+6);const weekEnd=sunday.toISOString().slice(0,10);
  if(s.completions.filter(v=>v.task_id===task.id&&(frequency==='once'||frequency==='weekly'?(frequency==='once'||v.day>=weekStart&&v.day<=weekEnd):v.day===s.local_day)).length>=(frequency==='once'?1:Math.min(task.daily_limit,s.preferences.task_daily_limit)))throw new ApiError('DAILY_LIMIT');
  s.completions.push({id:uuid(),task_id:task.id,day:s.local_day,reward:task.reward,created_at:iso});coins(task.reward,'task:'+(task.key??'custom'),task.reward);
  if(!s.achievements.some(v=>v.key==='first_task'))s.achievements.push({id:uuid(),key:'first_task',earned_at:iso});
 }else if(action==='task_create'){
  const title=String(p.title??'').trim();if(!title||title.length>100)throw new ApiError('INVALID_PAYLOAD');
  const frequency=p.frequency??'daily';if(!['daily','weekly','once'].includes(String(frequency)))throw new ApiError('INVALID_PAYLOAD');const reward=integer(p.reward,1,s.preferences.custom_reward_limit);s.tasks.push({id:uuid(),key:null,title,reward,category:String(p.category??'custom'),frequency:frequency as 'daily'|'weekly'|'once',daily_limit:integer(p.daily_limit??1,1,s.preferences.task_daily_limit),archived:false});
 }else if(action==='task_update'){
  const task=s.tasks.find(v=>v.id===p.task_id);if(!task)throw new ApiError('NOT_FOUND');
  if(p.daily_limit!==undefined)task.daily_limit=integer(p.daily_limit,1,s.preferences.task_daily_limit);
  if(!task.key){if(p.title!==undefined){const title=String(p.title).trim();if(!title||title.length>100)throw new ApiError('INVALID_PAYLOAD');task.title=title;}if(p.reward!==undefined)task.reward=integer(p.reward,1,s.preferences.custom_reward_limit);if(p.category!==undefined)task.category=String(p.category);if(p.frequency!==undefined){if(!['daily','weekly','once'].includes(String(p.frequency)))throw new ApiError('INVALID_PAYLOAD');task.frequency=p.frequency as 'daily'|'weekly'|'once';}}
 }else if(action==='task_archive'){const v=s.tasks.find(v=>v.id===p.task_id);if(!v)throw new ApiError('NOT_FOUND');v.archived=true;
 }else if(action==='study_start'){
  if(s.study_sessions.some(v=>v.status!=='finished'))throw new ApiError('SESSION_ACTIVE');const v={id:uuid(),status:'running' as const,started_at:iso,last_tick_at:iso,active_seconds:0,credited_minutes:0,bonus_awarded:false};s.study_sessions.unshift(v);result={session_id:v.id};
 }else if(['study_pause','study_finish','study_heartbeat'].includes(action)){const v=tick();if(action==='study_pause')v.status='paused';if(action==='study_finish')v.status='finished';result={session_id:v.id};
 }else if(action==='study_resume'){const v=session();if(v.status==='finished')throw new ApiError('NOT_FOUND');v.status='running';v.last_tick_at=iso;
 }else if(action==='prayer_set'){
  const prayer=p.prayer as Prayer,status=p.status as PrayerStatus,day=String(p.day??s.local_day);if(!(prayer in PRAYER_REWARDS)||!['pending','completed','missed','excused'].includes(status))throw new ApiError('INVALID_PAYLOAD');
  const days=(Date.parse(s.local_day)-Date.parse(day))/86400000;if(!Number.isFinite(days)||days<0||days>7)throw new ApiError('INVALID_PAYLOAD');
  if(status==='missed'&&p.confirmed_missed!==true)throw new ApiError('CONFIRMATION_REQUIRED');
  let v=s.prayers.find(v=>v.day===day&&v.prayer===prayer);if(!v){v={id:uuid(),day,prayer,status:'pending',updated_at:iso};s.prayers.push(v);}
  const value=(status:PrayerStatus)=>status==='completed'?PRAYER_REWARDS[prayer]:status==='missed'?-100:0;
  if(v.status!==status){if(value(v.status))coins(-value(v.status),'prayer:'+prayer+':correction');const xpkey=day+prayer;const xp=status==='completed'&&!record.prayer_xp.includes(xpkey)?PRAYER_REWARDS[prayer]:0;if(xp)record.prayer_xp.push(xpkey);if(value(status))coins(value(status),'prayer:'+prayer+':'+status,xp);v.status=status;v.updated_at=iso;}
 }else if(action==='project_start'){
  s.projects??=[];
  if(s.projects.some(v=>v.status==='saving'))throw new ApiError('PROJECT_ACTIVE');
  const item=CATALOG.find(v=>v.id===p.catalog_id&&['house','villa','apartment','skyscraper','palace'].includes(v.model));if(!item)throw new ApiError('NOT_FOUND');
  if(item.unlock_level>levelFromXp(s.wallet.city_xp))throw new ApiError('LEVEL_LOCKED');
  const project={id:uuid(),catalog_id:item.id,target_price:item.price,funded:0,status:'saving' as const,inventory_id:null,created_at:iso};s.projects.unshift(project);result={project_id:project.id};
 }else if(action==='project_contribute'||action==='project_cancel'){
  const project=(s.projects??[]).find(v=>v.id===p.project_id&&v.status==='saving');if(!project)throw new ApiError('PROJECT_NOT_ACTIVE');
  if(action==='project_cancel'){const refunded=project.funded;if(refunded)coins(refunded,'project:refund:'+project.catalog_id);project.status='cancelled';project.funded=0;result={refunded};}
  else{const amount=integer(p.amount,1,1000000);if(amount>project.target_price-project.funded)throw new ApiError('PROJECT_AMOUNT');if(amount>s.wallet.balance)throw new ApiError('INSUFFICIENT_FUNDS');coins(-amount,'project:contribution:'+project.catalog_id);project.funded+=amount;if(project.funded===project.target_price){const id=uuid();s.inventory.push({id,catalog_id:project.catalog_id,user_id:s.profile.id,created_at:iso});project.inventory_id=id;project.status='completed';result={inventory_id:id};}}
 }else if(action.startsWith('share_')||action==='visit_react')throw new ApiError('DEMO_SHARING_REQUIRES_ACCOUNTS');
 else if(action==='purchase'){
  const item=CATALOG.find(v=>v.id===p.catalog_id);if(!item)throw new ApiError('NOT_FOUND');if(item.unlock_level>levelFromXp(s.wallet.city_xp))throw new ApiError('LEVEL_LOCKED');if(s.wallet.balance<item.price)throw new ApiError('INSUFFICIENT_FUNDS');coins(-item.price,'purchase:'+item.id);const id=uuid();s.inventory.push({id,catalog_id:item.id,user_id:s.profile.id,created_at:iso});result={inventory_id:id};
 }else if(action==='place')place(false);else if(action==='interior_place')place(true);
 else if(['move','remove','interior_move','interior_remove'].includes(action)){
  const interior=action.startsWith('interior'),list=interior?s.furniture:s.placements,v=list.find(v=>v.id===p.placement_id);if(!v)throw new ApiError('NOT_FOUND');if(v.version!==p.expected_version)throw new ApiError('VERSION_CONFLICT');
  if(action.endsWith('remove')){if(interior)s.furniture=list.filter(a=>a.id!==v.id);else{s.placements=list.filter(a=>a.id!==v.id);s.furniture=s.furniture.filter(a=>a.house_id!==v.id);}}else{const item=CATALOG.find(i=>i.id===v.catalog_id)!;const x=integer(p.x),z=integer(p.z),rotation=integer(p.rotation,0,270);if(!canPlace(item,x,z,rotation,interior?8:s.world.size,list.filter(a=>!interior||a.house_id===v.house_id),CATALOG,v.id))throw new ApiError('INVALID_PLACEMENT');Object.assign(v,{x,z,rotation,version:v.version+1});}s.world.version++;
 }else if(action==='land_expand'){if(s.world.size>=32)throw new ApiError('DAILY_LIMIT');if(s.wallet.balance<1000)throw new ApiError('INSUFFICIENT_FUNDS');coins(-1000,'land_expand');s.world.size+=4;s.world.version++;s.wallet.city_xp+=100;
 }else if(action==='profile_update'){
  const display=String(p.display_name??s.profile.display_name).trim();if(!display||display.length>60)throw new ApiError('INVALID_PAYLOAD');s.profile.display_name=display;
  if(p.language==='ar-SA'||p.language==='en')s.profile.language=p.language;if(['light','dark','system'].includes(String(p.theme)))s.profile.theme=p.theme as 'light'|'dark'|'system';if(p.digits==='latin'||p.digits==='local')s.profile.digits=p.digits;if(p.currency_label==='coins'||p.currency_label==='points')s.profile.currency_label=p.currency_label;
  if(p.avatar!==undefined){if(!['sprout','sun','moon','home'].includes(String(p.avatar)))throw new ApiError('INVALID_PAYLOAD');s.profile.avatar=String(p.avatar);}
  if(p.timezone){try{localDay(now,String(p.timezone));s.profile.timezone=String(p.timezone);}catch{throw new ApiError('INVALID_TIMEZONE');}}
  for(const k of ['custom_reward_limit','task_daily_limit'] as const)if(p[k]!==undefined)s.preferences[k]=integer(p[k],1,k==='custom_reward_limit'?10000:20);
  if(p.task_daily_limit!==undefined)for(const task of s.tasks)if(task.key)task.daily_limit=s.preferences.task_daily_limit;
  for(const k of ['audio','notifications','prayer_reminders'] as const)if(typeof p[k]==='boolean')s.preferences[k]=p[k];
 }else if(action.startsWith('partner_'))throw new ApiError('DEMO_PARTNER_REQUIRES_ACCOUNTS');
 else throw new ApiError('INVALID_PAYLOAD');
 observeGuestTasks(s,action,p,key,oldSessions,oldPrayerStatus);
 return {state:s,result};
}
export const demoApi:GameApi={mode:'demo',async getUser(){return await readRecord<boolean>(SESSION)?{id:'guest',email:'guest@local.invalid'}:null;},async signIn(){throw new ApiError('CLOUD_NOT_CONFIGURED');},async signUp(){throw new ApiError('CLOUD_NOT_CONFIGURED');},async signOut(){await removeRecord(SESSION);},async resetPassword(){throw new ApiError('CLOUD_NOT_CONFIGURED');},async updatePassword(){throw new ApiError('CLOUD_NOT_CONFIGURED');},async visit(){throw new ApiError('DEMO_SHARING_REQUIRES_ACCOUNTS');},async getState(){return atomicRecord<DemoRecord,GameSnapshot>(KEY,current=>{const r=current??initial();upgradeGuest(r.state);upgradeGuestTasks(r.state);r.state.projects??=[];r.state.city_share??=null;r.state.server_now=new Date().toISOString();r.state.local_day=localDay(new Date(),r.state.profile.timezone);return {value:r,result:r.state};});},async command(action,payload,key){if(action==='delete_account'){if(payload.confirmation!=='DELETE')throw new ApiError('CONFIRMATION_REQUIRED');await removeRecord(KEY);await removeRecord(SESSION);return {state:null,result:{deleted:true}};}return atomicRecord<DemoRecord,CommandResponse>(KEY,(current)=>{const r=current??initial(),old=r.receipts[key];if(old){if(old.action!==action||old.payload!==JSON.stringify(payload))throw new ApiError('CONFLICT');return {value:r,result:{state:r.state,result:old.result}};}const response=perform(r,action,payload,key);r.receipts[key]={action,payload:JSON.stringify(payload),result:response.result};return {value:r,result:response};});},async deleteAccount(){await removeRecord(KEY);await removeRecord(SESSION);}};
export async function enterGuest():Promise<SessionUser>{await writeRecord(SESSION,true);return {id:'guest',email:'guest@local.invalid'};}
