import type {Realm,Surprise,WorldContext,WorldPatch,WorldTools} from './world-types.ts';
import {fail,numeric,owned,priced,text} from './world-math.ts';
export function surprises(c:WorldContext,op:string,p:Record<string,unknown>,q:WorldPatch,realm:Realm,t:WorldTools):boolean{
 if(op==='surprise_save'){
  const old=p.surprise_id?owned(c,p.surprise_id,'surprise',realm):null;
  if(!old&&c.world.entities.filter(e=>e.kind==='surprise'&&e.realm===realm&&e.status==='active').length>=8)return fail('SURPRISE_LIMIT');
  const s:Surprise=old?structuredClone(old):{...t.base(c,realm,'surprise',text(p,'name',60)),kind:'surprise',note:'',props:[],reveal:{mode:'manual',at:null,slug:null,revealed_at:null,consented:false},share_enabled:false};
  s.name=text(p,'name',60);s.note=typeof p.note==='string'?p.note.slice(0,1000):fail('INVALID_PAYLOAD');if(s.reveal.revealed_at&&s.share_enabled)return fail('DISABLE_SHARE_BEFORE_EDIT');
  if(!['manual','date','milestone'].includes(String(p.mode)))return fail('INVALID_REVEAL');s.reveal.mode=p.mode as Surprise['reveal']['mode'];
  s.reveal.at=p.mode==='date'&&typeof p.at==='string'&&Number.isFinite(Date.parse(p.at))?new Date(p.at).toISOString():null;s.reveal.slug=p.mode==='milestone'&&['five_tasks_day','study_20_hours_week','all_weekly_goals','commitment_30_days'].includes(String(p.slug))?String(p.slug):null;
  if(p.mode==='date'&&!s.reveal.at||p.mode==='milestone'&&!s.reveal.slug)return fail('INVALID_REVEAL');
  if(old)s.version++;q.upsert.push(s);q.result={surprise_id:s.id,private:true};
 }else if(op==='surprise_prop'){
  const s=structuredClone(owned(c,p.surprise_id,'surprise',realm));if(s.props.length>=24||s.share_enabled)return fail('SURPRISE_EDIT_BLOCKED');if(!['flowers','present','memory'].includes(String(p.type)))return fail('INVALID_PAYLOAD');
  const id=crypto.randomUUID(),type=p.type as 'flowers'|'present'|'memory';t.bill(c,q,s,'prop:'+id,'Private '+type,priced(1,type==='present'?1200:type==='flowers'?600:800));s.props.push({id,type,x:numeric(p,'x',.4,7.6),z:numeric(p,'z',.4,7.6),text:typeof p.text==='string'?p.text.slice(0,140):''});s.version++;q.upsert.push(s);q.result={surprise_id:s.id,prop_id:id};
 }else if(op==='surprise_prop_remove'){
  const s=structuredClone(owned(c,p.surprise_id,'surprise',realm));if(s.share_enabled)return fail('DISABLE_SHARE_BEFORE_EDIT');if(!s.props.some(v=>v.id===p.prop_id))return fail('NOT_OWNED');t.destroy(c,q,s.id,['prop:'+String(p.prop_id)]);s.props=s.props.filter(v=>v.id!==p.prop_id);s.version++;q.upsert.push(s);q.result={removed:true};
 }else if(op==='surprise_reveal'){
  const s=structuredClone(owned(c,p.surprise_id,'surprise',realm));if(s.reveal.revealed_at)return fail('ALREADY_REVEALED');
  if(p.confirmed!==true)return fail('CONFIRMATION_REQUIRED');if(s.reveal.mode==='date'&&Date.parse(c.now)<Date.parse(s.reveal.at!))return fail('REVEAL_NOT_DUE');if(s.reveal.mode==='milestone'&&!c.milestones.includes(s.reveal.slug!))return fail('REVEAL_NOT_DUE');s.reveal.revealed_at=c.now;s.reveal.consented=true;s.version++;q.upsert.push(s);t.event(c,q,realm,'surprise',s.id+':reveal','لحظة مفاجأة خاصة',s.id,{private:true});q.result={revealed:true};
 }else if(op==='surprise_share'){
  const s=structuredClone(owned(c,p.surprise_id,'surprise',realm));if(p.enabled!==false&&(!s.reveal.revealed_at||!s.reveal.consented||p.confirmed!==true))return fail('REVEAL_CONSENT_REQUIRED');
  const token=p.enabled===false?null:crypto.randomUUID().replaceAll('-','')+crypto.randomUUID().replaceAll('-','');s.share_enabled=!!token;s.version++;q.upsert.push(s);q.share={surprise_id:s.id,token};q.result={share_token:token,expires_in_days:token?7:null};
 }else if(op==='surprise_delete'){
  const s=owned(c,p.surprise_id,'surprise',realm);t.destroy(c,q,s.id);q.retire.push(s.id);q.share={surprise_id:s.id,token:null};q.result={deleted:true};
 }else return false;return true;
}
