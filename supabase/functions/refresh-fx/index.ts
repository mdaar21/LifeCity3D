import {createClient} from 'npm:@supabase/supabase-js@2.78.0';
import {fetchFx} from '../_shared/fx.ts';
const allowedOrigins=new Set(['https://mdaar21.github.io','http://localhost:5173','http://127.0.0.1:5173']);
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get('origin');
 if(origin&&!allowedOrigins.has(origin))return new Response(null,{status:403});
 const headers={'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Origin':origin??'https://mdaar21.github.io','Vary':'Origin','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS'};
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method!=='POST')return new Response(JSON.stringify({error:'METHOD_NOT_ALLOWED'}),{status:405,headers});
 try{
  const token=req.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
  if(!token)return new Response(JSON.stringify({error:'AUTH_REQUIRED'}),{status:401,headers});
  const url=Deno.env.get('SUPABASE_URL')!;
  const publicKey=JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS')||'{}').default||Deno.env.get('SUPABASE_ANON_KEY');
  const userClient=createClient(url,publicKey,{auth:{persistSession:false}});
  const {data,error}=await userClient.auth.getUser(token);
  if(error||!data.user)return new Response(JSON.stringify({error:'AUTH_REQUIRED'}),{status:401,headers});
  const key=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}').default||Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const admin=createClient(url,key,{auth:{persistSession:false}});
  const cached=await admin.from('fx_rate_snapshots').select('rate_time').order('rate_time',{ascending:false}).limit(1).maybeSingle();
  if(cached.data&&Date.now()-Date.parse(cached.data.rate_time)<24*3600_000)return new Response(JSON.stringify({ok:true,cached:true}),{headers});
  const rates=await fetchFx();const saved=await admin.rpc('fx_store_snapshot',{p_data:rates});
  if(saved.error)throw new Error('FX_UNAVAILABLE');
  return new Response(JSON.stringify({ok:true,cached:false}),{headers});
 }catch{return new Response(JSON.stringify({error:'FX_UNAVAILABLE'}),{status:503,headers});}
});
