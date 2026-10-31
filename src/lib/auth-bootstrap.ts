import type {BackendMode} from './types';

/** A verified email callback must reach Supabase even after a local guest visit.
 * This only selects the adapter; Supabase still validates the callback/session.
 * Guest data remains in its existing separate storage.
 */
export function initialAuthMode(configured:BackendMode,href:string,guest:boolean):BackendMode{
 if(configured==='supabase'){
  const url=new URL(href),fragment=new URLSearchParams(url.hash.slice(1));
  if(url.searchParams.has('code')||(fragment.has('access_token')&&fragment.has('refresh_token')))return configured;
 }
 return guest?'demo':configured;
}
