import type {FarmState} from './world-horticulture.ts';
/** Persistent world coordinates are meters in a territory; appearance never changes ownership. */
export type Realm='main'|'yuyi';
export type WalletId='MAIN'|'YUYI_MAD';
export interface Point {x:number;z:number}
export interface Pose extends Point {y:number;heading:number}
export interface Rect extends Point {width:number;depth:number}
export type EntityKind='parcel'|'terrain'|'building'|'node'|'edge'|'line'|'avatar'|'car'|'blueprint'|'surprise'|'decoration'|'furniture'|'district';
export interface BaseEntity {id:string;realm:Realm;kind:EntityKind;version:number;name:string;created_at:string;status:'active'|'stored'|'retired'}
export interface LandFactors {base_per_m2:string;waterfront:number;road_access:number;capacity:number}
export interface Installments {total:string;paid:string;remaining:string;payments:{amount:string;due_at:string;paid_at:string|null}[];wallet:WalletId;enabled:boolean}
export interface Parcel extends BaseEntity {kind:'parcel';polygon:Point[];zone:'mixed'|'residential'|'commercial'|'services';initial:boolean;title_history:{action:string;at:string;parents:string[]}[];factors:LandFactors;financing:Installments|null}
export interface TerrainOperation {id:string;indices:number[];before:number[];after:number[];component_ids:string[];created_at:string}
export interface Terrain extends BaseEntity {kind:'terrain';side:number;heights_cm:number[];operations:TerrainOperation[]}
export type Archetype='house'|'villa'|'restaurant'|'mall'|'hotel'|'resort'|'school'|'university'|'clinic'|'hospital'|'garage'|'museum'|'office';
export type RoomUse='bedroom'|'living'|'kitchen'|'bathroom'|'shop'|'dining'|'cinema'|'guest'|'reception'|'classroom'|'waiting'|'treatment'|'parking'|'exhibit'|'office';
export interface Room extends Rect {id:string;name:string;use:RoomUse;door:Point;material:string;capacity:number}
export interface FloorPlan {index:number;height:number;rooms:Room[];corridor:Rect;stairs:Rect|null;elevator:Rect|null;entry:Point;area:number}
export interface BuildStage {id:string;type:'foundation'|'frame'|'floor'|'roof'|'finish'|'opening';floor:number|null;paid:boolean;component_ids:string[]}
export interface MaterialAssignment {surface:'walls'|'roof'|'floor'|'stairs'|'doors'|'windows';floor:number|null;room_id:string|null;material:string;quality:number;component_id:string}
export interface Tenant {id:string;room_id:string;name:string;type:'retail'|'food'|'cinema';rent_per_hour:string}
export interface Restaurant {menu:{id:string;name:string;category:string;price:string}[];opens:number;closes:number;served:number;satisfaction:number}
export interface Building extends BaseEntity,Rect {kind:'building';style?:'forest'|'desert'|'coastal';parcel_id:string;archetype:Archetype;rotation:0|90;y:number;floors:FloorPlan[];stages:BuildStage[];contractor:string;materials:MaterialAssignment[];tenants:Tenant[];staff:number;capacity:number;restaurant?:Restaurant;hotel:{rooms:{room_id:string;type:'standard'|'suite';rate:string}[];occupied:number;arrivals:number;last_tick_at:string}|null;last_income_at:string;opened_at:string|null}
export type Network='road'|'power'|'water'|'sewage'|'metro';
export type NodeRole='junction'|'plant'|'solar'|'battery'|'transformer'|'streetlight'|'tank'|'pump'|'treatment'|'bus_stop'|'metro_station'|'depot'|'consumer';
export interface Signal {mode:'cycle'|'stop'|'yield';ns_green:number;ew_green:number;all_red:number;offset:number}
export interface NetworkNode extends BaseEntity,Point {kind:'node';network:Network;role:NodeRole;y:number;capacity:number;demand:number;building_id:string|null;signal:Signal|null;energy:number;last_tick_at:string}
export interface NetworkEdge extends BaseEntity {kind:'edge';network:Network;from:string;to:string;directed:boolean;lanes:number;speed:number;capacity:number;depth:number;blocked:boolean}
export interface TransitLine extends BaseEntity {kind:'line';mode:'bus'|'metro'|'train';stops:string[];color:string;capacity:number;depart_every:number;enabled:boolean}
export interface Appearance {skin:string;hair:'short'|'curly'|'long'|'none';hair_color:string;top:string;bottom:string;shoes:string;outfit:'casual'|'builder'|'formal';accessory:'none'|'cap'|'glasses'|'backpack'}
export interface Avatar extends BaseEntity {kind:'avatar';appearance:Appearance;presets:{id:string;name:string;appearance:Appearance}[];pose:Pose;inside_building:string|null;floor:number;mode:'aerial'|'follow'|'first'|'drive';vehicle_id:string|null;last_moved_at:string}
export interface Car extends BaseEntity {kind:'car';model:'cedar'|'dune'|'atlas';pose:Pose;garage_id:string|null;slot:number|null;paint:string;rims:'standard'|'sport'|'classic';tint:number;plate:string;trim:'standard'|'wood'|'metal';components:Record<string,string>}
export interface Blueprint extends BaseEntity {kind:'blueprint';archetype:Archetype;width:number;depth:number;floors:FloorPlan[];style:'forest'|'desert'|'coastal';accessible:boolean;estimated_cost:string;planner:'deterministic';room_requests:{name:string;use:RoomUse;area:number}[]}
export interface Surprise extends BaseEntity {kind:'surprise';note:string;props:{id:string;type:'flowers'|'present'|'memory';x:number;z:number;text:string}[];reveal:{mode:'manual'|'date'|'milestone';at:string|null;slug:string|null;revealed_at:string|null;consented:boolean};share_enabled:boolean}
export interface Decoration extends BaseEntity,Point {kind:'decoration';species?:string;farm?:FarmState;type:'park'|'tree'|'bench'|'lamp'|'fountain'|'pet_habitat'|'vegetation'|'farm_plot';width:number;depth:number;material:string}
export interface Furniture extends BaseEntity,Point {kind:'furniture';type:'bed'|'chair'|'table'|'sofa'|'counter'|'plant'|'shelf';building_id:string|null;floor:number;room_id:string|null;rotation:number;material:string;width:number;depth:number}
export interface District extends BaseEntity {kind:'district';parcel_ids:string[];color:string;policy:'mixed'|'residential'|'commercial'|'park'}
export type WorldEntity=Parcel|Terrain|Building|NetworkNode|NetworkEdge|TransitLine|Avatar|Car|Blueprint|Surprise|Decoration|Furniture|District;
export interface WorldSettings {quality:'low'|'standard';hour:number|null;clock:'real'|'game'|'fixed';day_minutes:number;weather:'clear'|'clouds'|'rain'|'fog';simulate_residents:boolean;free_drive:boolean;infrastructure:boolean;muted:boolean;reduced_motion:boolean;photosensitive:boolean;installments_enabled:boolean;celebrations_enabled:boolean}
export interface CityEvent {id:string;realm:Realm;kind:string;source_key:string;entity_id:string|null;title:string;created_at:string;metadata:Record<string,unknown>;seen:boolean}
export interface PaidComponent {id:string;entity_id:string;part:string;wallet:WalletId;paid:string;currency:'SAR'|'MAD';fx_id:string|null;destroyed_at:string|null;created_at:string}
export interface BillLine {id:string;entity_id:string;part:string;description:string;canonical:string;wallet:WalletId;paid:string;currency:'SAR'|'MAD';fx_id:string|null}
export interface WorldPatch {upsert:WorldEntity[];retire:string[];destroy_components:string[];bill:BillLine[];events:CityEvent[];settings?:WorldSettings;income?:{amount:string};result:Record<string,unknown>;share?:{surprise_id:string;token:string|null}}
export interface WorldQuote {id:string;realm:Realm;revision:number;legacy_versions:Record<Realm,number>;action:string;payload:Record<string,unknown>;patch:WorldPatch;refunds:{wallet:WalletId;amount:string;basis:string;component_ids:string[]}[];created_at:string;expires_at:string;fx_id:string|null}
export interface DistrictMetrics {realm:Realm;population:number;score:number|null;breakdown:{parks:number;transport:number;power:number;water:number;education:number;health:number;traffic:number;leisure:number};powered:string[];watered:string[];sewage:string[];unpowered:string[];transit_valid:Record<string,boolean>;service_coverage:Record<string,number>}
export interface WorldHistory {id:string;title:string;created_at:string;realm:Realm;entities?:WorldEntity[];delta?:{upsert:WorldEntity[];retire:string[]};placements?:HistoryPlacement[];yuyi_placements?:HistoryPlacement[]}
export interface HistoryPlacement {id:string;inventory_id:string;catalog_id:string;x:number;y:number;z:number;rotation:number;version:number}
export interface WorldHistoryView {entities:WorldEntity[];placements:HistoryPlacement[];yuyi_placements:HistoryPlacement[]}
export interface WorldSnapshot {history?:WorldHistory[];version:1;initialized:boolean;revision:number;entities:WorldEntity[];settings:WorldSettings;events:CityEvent[];components:PaidComponent[];quotes:WorldQuote[];metrics:DistrictMetrics[]}
export interface WorldContext {user_id:string;now:string;world:WorldSnapshot;balances:Record<WalletId,string>;fx:{id:string;rate_time:string;mad_rate:string;display_rate:string|null;currency:string}|null;legacy:{realm:Realm;id:string;catalog_id:string;rotation?:number;x:number;z:number;width:number;depth:number}[];legacy_sizes:Record<Realm,number>;legacy_versions:Record<Realm,number>;eligible_income:string;income_paid:string;legitimate_minutes:number;legitimate_actions:number;milestones:string[];receipt:{action:string;payload:Record<string,unknown>;result:Record<string,unknown>}|null}
export interface WorldTransition {expected_revision:number;legacy_versions:Record<Realm,number>;patch:WorldPatch;quote:WorldQuote|null;used_quote_id:string|null;result:Record<string,unknown>;refunds:WorldQuote['refunds']}
export interface WorldTools {base:(c:WorldContext,realm:Realm,kind:EntityKind,name:string)=>BaseEntity;bill:(c:WorldContext,q:WorldPatch,e:WorldEntity,part:string,description:string,canonical:string)=>BillLine;destroy:(c:WorldContext,q:WorldPatch,id:string,parts?:string[])=>void;event:(c:WorldContext,q:WorldPatch,realm:Realm,kind:string,source:string,title:string,entity:string|null,metadata?:Record<string,unknown>)=>void;effort:(c:WorldContext,q:WorldPatch,value:number)=>void}
