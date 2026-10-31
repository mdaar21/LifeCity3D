import type {InventoryItem,Placement,World} from './types';
export type Territory='main'|'yuyi';
export interface FxSnapshot {id:string;provider:string;source_url:string;rate_time:string;next_update:string;display_rate:string|null;mad_rate:string;stale:boolean}
export interface YuyiTransaction {id:string;delta:string|number;balance_before:string|number;balance_after:string|number;actor_id:string|null;source:'manual_yuyi_instruction'|'verified_partner'|'purchase'|'demolition'|'reversal';note:string;reverses_id:string|null;created_at:string}
export interface V6Foundation {version:number;display_currency:string;yuyi_wallet:{balance:string;currency:'MAD'};yuyi_world:World&{city_xp:number};yuyi_inventory:InventoryItem[];yuyi_placements:Placement[];yuyi_ledger:YuyiTransaction[];demolitions:unknown[];fx:FxSnapshot|null}
export interface DemolitionQuote {realm:Territory;placement_id:string;expected_version:number;paid_basis:string;refund:string;rate:string;land_retained:true;kept_inventory:string[];components:{id:string;inventory_id:string;component:string;paid:string;currency:string}[]}
export interface YuyiQuote {id:string;catalog_id:string;mad_cost:number;canonical_cost:number;fx_id:string;expires_at:string}
