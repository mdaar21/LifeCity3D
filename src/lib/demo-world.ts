import type {CommandResponse,GameSnapshot} from './types';
import {ApiError,errorCode} from './errors';
import {viewWorldContext} from './world-state';
import {previewTransition,worldTransition} from '../../supabase/functions/_shared/world-engine';
import {amount,money} from '../../supabase/functions/_shared/world-math';
export function guestWorld(s:GameSnapshot,action:string,p:Record<string,unknown>,key:string):CommandResponse|null{
 if(!action.startsWith('world_'))return null;
 if((p.request as Record<string,unknown>|undefined)?.operation==='surprise_share'||(p.request as Record<string,unknown>|undefined)?.share_enabled)throw new ApiError('DEMO_SHARING_REQUIRES_ACCOUNTS');
 try{
  const c=viewWorldContext(s);if(action==='world_apply'&&(p.operation==='surprise_share'))throw new ApiError('DEMO_SHARING_REQUIRES_ACCOUNTS');
  const transition=worldTransition(c,action,p);s.world_systems=previewTransition(c,transition);
  const charges={MAIN:0n,YUYI_MAD:0n};for(const l of transition.patch.bill)charges[l.wallet]-=amount(l.paid);for(const r of transition.refunds)charges[r.wallet]+=amount(r.amount);if(transition.patch.income)charges.MAIN+=amount(transition.patch.income.amount);
  if(charges.MAIN!==0n){s.wallet.balance=Number(money(amount(String(s.wallet.balance))+charges.MAIN));s.ledger.unshift({id:crypto.randomUUID(),delta:Number(money(charges.MAIN)),reason:transition.patch.income?'world:business_income':charges.MAIN>0?'world:refund':'world:purchase',actor_id:s.profile.id,created_at:s.server_now,idempotency_key:key+':world'});}
  if(charges.YUYI_MAD!==0n&&s.v6){const before=s.v6.yuyi_wallet.balance,after=money(amount(before)+charges.YUYI_MAD);s.v6.yuyi_wallet.balance=after;s.v6.yuyi_ledger.unshift({id:crypto.randomUUID(),delta:money(charges.YUYI_MAD),balance_before:before,balance_after:after,actor_id:s.profile.id,source:charges.YUYI_MAD>0n?'demolition':'purchase',note:'World components',reverses_id:null,created_at:s.server_now});}
  return {state:s,result:transition.result};
 }catch(e){throw new ApiError(errorCode(e));}
}
