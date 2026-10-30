export type Language='ar-SA'|'en';
export type BackendMode='demo'|'local'|'supabase';
export type Json=string|number|boolean|null|Json[]|{[key:string]:Json|undefined};
export interface Profile {id:string;email?:string;display_name:string;language:Language;timezone:string;theme:'light'|'dark'|'system';digits:'latin'|'local';currency_label:'coins'|'points';avatar?:string;created_at?:string}
export interface Wallet {balance:number;player_xp:number;city_xp:number}
export interface World {id:string;user_id:string;size:number;version:number}
export type Category='roads'|'nature'|'homes'|'landmarks'|'furniture'|'water'|'vehicles';
export interface CatalogItem {id:string;name_ar:string;name_en:string;description_ar:string;description_en:string;price:number;category:Category;footprint_x:number;footprint_z:number;unlock_level:number;model:string;is_furniture:boolean}
export interface InventoryItem {id:string;user_id?:string;catalog_id:string;created_at:string}
export interface Placement {id:string;inventory_id:string;catalog_id:string;x:number;y:number;z:number;rotation:number;version:number;world_id?:string;house_id?:string;variant?:string}
export interface Task {id:string;user_id?:string;key:string|null;title:string;title_ar?:string;title_en?:string;reward:number;category:string;daily_limit:number;archived:boolean}
export interface Completion {id:string;task_id:string;day:string;reward:number;created_at:string}
export type Prayer='fajr'|'dhuhr'|'asr'|'maghrib'|'isha';
export type PrayerStatus='pending'|'completed'|'missed'|'excused';
export interface PrayerLog {id:string;day:string;prayer:Prayer;status:PrayerStatus;updated_at:string}
export interface StudySession {id:string;status:'running'|'paused'|'finished';started_at:string;last_tick_at:string;active_seconds:number;credited_minutes:number;bonus_awarded:boolean;idle_capped?:boolean}
export interface LedgerEntry {id:string;delta:number;reason:string;actor_id:string|null;created_at:string;idempotency_key:string}
export interface PartnerLink {id:string;owner_id:string;partner_id:string|null;status:'pending'|'active'|'revoked';expires_at?:string;created_at:string}
export interface PartnerPolicy {link_id:string;can_award:boolean;can_deduct:boolean;can_view_city:boolean;can_view_tasks:boolean;max_award:number;max_deduction:number;daily_award_limit:number;daily_deduction_limit:number}
export interface PartnerAction {id:string;owner_id:string;partner_id:string;amount:number;reason:string;note:string;created_at:string}
export interface PartnerMessage {id:string;owner_id:string;sender_id:string;message:string;created_at:string}
export interface PartnerChallenge {id:string;owner_id:string;partner_id:string;title:string;reward:number;status:string;created_at:string}
export interface YuyiMemory {id:string;user_id:string;growth:number;note:string;created_at:string}
export interface Achievement {id:string;key:string;earned_at:string}
export interface Preferences {custom_reward_limit:number;task_daily_limit:number;prayer_reminders:boolean;audio:boolean;notifications:boolean}
export interface GameSnapshot {profile:Profile;wallet:Wallet;world:World;catalog:CatalogItem[];inventory:InventoryItem[];placements:Placement[];furniture:Placement[];tasks:Task[];completions:Completion[];prayers:PrayerLog[];study_sessions:StudySession[];ledger:LedgerEntry[];partner_links:PartnerLink[];partner_permissions:PartnerPolicy[];partner_actions:PartnerAction[];partner_messages:PartnerMessage[];partner_challenges:PartnerChallenge[];yuyi_memories:YuyiMemory[];achievements:Achievement[];preferences:Preferences;server_now:string;local_day:string}
export interface CommandResponse {state:GameSnapshot|null;result:Record<string,unknown>}
export interface SessionUser {id:string;email:string;display_name?:string}
export interface GameApi {mode:BackendMode;signIn(email:string,password:string):Promise<SessionUser>;signUp(email:string,password:string,name:string):Promise<{user:SessionUser|null;confirmation_required:boolean}>;signOut():Promise<void>;getUser():Promise<SessionUser|null>;resetPassword(email:string):Promise<void>;updatePassword(password:string):Promise<void>;getState():Promise<GameSnapshot>;command(action:string,payload:Record<string,unknown>,key:string):Promise<CommandResponse>;subscribe?(onChange:()=>void):()=>void;deleteAccount():Promise<void>}
