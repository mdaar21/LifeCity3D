import type {GameSnapshot} from './types';
import type {V6Foundation} from './v6-types';
import {addMoney,fixed,decimalString} from './money';
import {ApiError} from './errors';
import type {CommandResponse} from './types';
export function upgradeGuest(s:GameSnapshot){s.v6??={version:1,display_currency:'SAR',yuyi_wallet:{balance:'0.0000',currency:'MAD'},yuyi_world:{id:crypto.randomUUID(),user_id:s.profile.id,size:s.world.size,version:1,city_xp:0},yuyi_inventory:[],yuyi_placements:[],yuyi_ledger:[],demolitions:[],fx:null} satisfies V6Foundation;return s;}
export function guestV6(s:GameSnapshot,action:string,p:Record<string,unknown>,key:string,receipts:Record<string,{action:string;payload:string;result:Record<string,unknown>}>= {}):CommandResponse|null{
 const v=upgradeGuest(s).v6!;
 if(action==='currency_set'){if(p.currency!=='SAR')throw new ApiError('FX_UNAVAILABLE');v.display_currency='SAR';return {state:s,result:{currency:'SAR'}};}
 if(action==='yuyi_quote'||action==='yuyi_purchase')throw new ApiError('FX_UNAVAILABLE');
 if(action==='demolition_quote'||action==='demolish'){
  if(p.realm==='yuyi')throw new ApiError('NOT_FOUND');
  const placed=s.placements.find(x=>x.id===p.placement_id);if(!placed)throw new ApiError('NOT_FOUND');if(placed.version!==p.expected_version)throw new ApiError('VERSION_CONFLICT');
  const discard=Array.isArray(p.destroy_furniture_ids)?p.destroy_furniture_ids.map(String):[];
  if(new Set(discard).size!==discard.length||discard.some(id=>!s.furniture.some(f=>f.inventory_id===id&&f.house_id===placed.id)))throw new ApiError('NOT_OWNED');
  const ids=[placed.inventory_id,...discard];let total=0n;const components:{id:string;inventory_id:string;component:string;paid:string;currency:string}[]=[];
  for(const id of ids){let basis=0n;const ledgerIds=new Set<string>();
   const project=s.projects?.find(x=>x.inventory_id===id&&x.status==='completed');
   for(const [request,receipt] of Object.entries(receipts)){
    let match=receipt.action==='purchase'&&receipt.result.inventory_id===id;
    if(project&&receipt.action==='project_contribute')try{match=JSON.parse(receipt.payload).project_id===project.id;}catch{/* Malformed local history is not a cost proof. */}
    if(!match)continue;for(const entry of s.ledger.filter(x=>x.idempotency_key.startsWith(request+':')&&x.delta<0)){if(ledgerIds.has(entry.id))continue;ledgerIds.add(entry.id);basis-=fixed(entry.delta);}
   }
   if(basis<=0n)throw new ApiError('COST_BASIS_UNVERIFIED');total+=basis;components.push({id:'guest-'+id,inventory_id:id,component:'verified local purchase',paid:decimalString(basis),currency:'SAR'});
  }
  const kept=s.furniture.filter(x=>x.house_id===placed.id&&!discard.includes(x.inventory_id)).map(x=>x.inventory_id);
  const result={realm:'main',placement_id:placed.id,expected_version:placed.version,paid_basis:decimalString(total),refund:decimalString(total/2n),rate:'50%',components,kept_inventory:kept,land_retained:true};
  if(action==='demolition_quote')return {state:s,result};
  if(p.confirmed!==true)throw new ApiError('CONFIRMATION_REQUIRED');if(p.quoted_basis!==result.paid_basis)throw new ApiError('QUOTE_EXPIRED');
  s.wallet.balance=Number(addMoney(s.wallet.balance,result.refund));s.ledger.unshift({id:crypto.randomUUID(),delta:Number(result.refund),reason:'demolition:refund',actor_id:s.profile.id,created_at:new Date().toISOString(),idempotency_key:key+':demolition'});
  s.placements=s.placements.filter(x=>x.id!==placed.id);s.furniture=s.furniture.filter(x=>x.house_id!==placed.id);s.inventory=s.inventory.filter(x=>!ids.includes(x.id));s.world.version++;v.demolitions.push(result);return {state:s,result};
 }
 if(action!=='yuyi_adjust'&&action!=='yuyi_reverse')return null;
 if(p.confirmed!==true)throw new ApiError('CONFIRMATION_REQUIRED');
 let amount=String(p.amount??''),reverses:string|null=null;
 if(action==='yuyi_reverse'){const old=v.yuyi_ledger.find(x=>x.id===p.entry_id&&['manual_yuyi_instruction','verified_partner'].includes(x.source));if(!old)throw new ApiError('NOT_FOUND');if(v.yuyi_ledger.some(x=>x.reverses_id===old.id))throw new ApiError('ALREADY_REVERSED');amount=String(old.delta).startsWith('-')?String(old.delta).slice(1):'-'+String(old.delta);reverses=old.id;}
 if(!/^-?\d{1,9}(\.\d{1,2})?$/.test(amount)||fixed(amount)===0n)throw new ApiError('INVALID_AMOUNT');
 const before=v.yuyi_wallet.balance;v.yuyi_wallet.balance=addMoney(before,amount);
 const id=crypto.randomUUID();v.yuyi_ledger.unshift({id,delta:amount,balance_before:before,balance_after:v.yuyi_wallet.balance,actor_id:s.profile.id,source:reverses?'reversal':'manual_yuyi_instruction',note:String(p.note??'').slice(0,1000),reverses_id:reverses,created_at:new Date().toISOString()});
 return {state:s,result:{entry_id:id,wallet:'YUYI_MAD',idempotency_key:key}};
}
