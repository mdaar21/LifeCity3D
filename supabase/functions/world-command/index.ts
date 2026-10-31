/* global Deno */
import {createClient} from 'npm:@supabase/supabase-js@2.78.0';
import {worldTransition} from '../_shared/world-engine.ts';
import type {WorldContext} from '../_shared/world-types.ts';
const origins=new Set(['https://mdaar21.github.io','http://localhost:5173','http://127.0.0.1:5173']);
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get('origin');if(origin&&!origins.has(origin))return new Response(null,{status:403});
 const headers={'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Origin':origin??'https://mdaar21.github.io','Vary':'Origin','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS'};
 const respond=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});if(req.method!=='POST')return respond({error:'METHOD_NOT_ALLOWED'},405);
 try{
  const token=req.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];if(!token)return respond({error:'AUTH_REQUIRED'},401);
  const url=Deno.env.get('SUPABASE_URL')!,publicKey=JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS')||'{}').default||Deno.env.get('SUPABASE_ANON_KEY');
  const userClient=createClient(url,publicKey,{auth:{persistSession:false}}),identity=await userClient.auth.getUser(token);if(identity.error||!identity.data.user)return respond({error:'AUTH_REQUIRED'},401);
  // Bound streamed bodies, including requests without a Content-Length header.
  if(Number(req.headers.get('content-length'))>32768)return respond({error:'INVALID_PAYLOAD'},413);
  const reader=req.body?.getReader();let size=0;const chunks:Uint8Array[]=[];if(!reader)return respond({error:'INVALID_PAYLOAD'},400);
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>32768){await reader.cancel();return respond({error:'INVALID_PAYLOAD'},413);}chunks.push(value);}const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  const body=JSON.parse(new TextDecoder().decode(bytes));if(!['world_quote','world_apply','world_commit'].includes(body.action)||!uuid.test(body.key)||!body.payload||typeof body.payload!=='object'||Array.isArray(body.payload))return respond({error:'INVALID_PAYLOAD'},400);
  const key=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}').default||Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),admin=createClient(url,key,{auth:{persistSession:false}}),user=identity.data.user.id;
  const loaded=await admin.rpc('world_service_context',{p_user:user,p_key:body.key});if(loaded.error)throw loaded.error;const context=loaded.data as WorldContext;context.now=new Date(context.now).toISOString();
  const transition=worldTransition(context,body.action,body.payload),saved=await admin.rpc('world_service_commit',{p_user:user,p_action:body.action,p_payload:body.payload,p_key:body.key,p_transition:transition});if(saved.error)throw saved.error;return respond(saved.data);
 }catch(error){const e=error as {code?:string;message?:string};const code=(e.code&&e.code!=='P0001'&&/^[A-Z_]{3,64}$/.test(e.code)?e.code:e.message?.match(/\b[A-Z][A-Z_]{2,63}\b/)?.[0])??'WORLD_UNAVAILABLE';return respond({error:code},code==='RATE_LIMIT'?429:code==='WORLD_UNAVAILABLE'?503:400);}
});
