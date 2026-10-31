import {worldTransition} from '../supabase/functions/_shared/world-engine.ts';
import type {WorldContext} from '../supabase/functions/_shared/world-types.ts';
import type {CommandResponse} from '../src/lib/types.ts';
import type {LocalDatabase} from './database.ts';

/** Only call after requireUser/CSRF validation; never take userId from request data. */
export function runWorldCommand(db:LocalDatabase,userId:string,action:string,payload:Record<string,unknown>,key:string=crypto.randomUUID()):Promise<CommandResponse>{
 return db.owner(async tx=>{
  const c=(await tx.query<{context:WorldContext}>('select public.world_service_context($1,$2) context',[userId,key])).rows[0]!.context;
  c.now=new Date(c.now).toISOString();const transition=worldTransition(c,action,payload);
  return (await tx.query<{response:CommandResponse}>('select public.world_service_commit($1,$2,$3::jsonb,$4,$5::jsonb) response',[userId,action,JSON.stringify(payload),key,JSON.stringify(transition)])).rows[0]!.response;
 });
}
