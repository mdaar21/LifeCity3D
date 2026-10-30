/** Build-time validation only. Never print or return configuration values. */
export interface ConfigIssue {code:string;message:string}
export interface BuildConfigResult {mode:'demo'|'local'|'supabase';errors:ConfigIssue[];warnings:ConfigIssue[]}
type Environment=Record<string,string|undefined>;

function publicKeyKind(key:string):'public'|'secret'|'invalid'{
 if(key.startsWith('sb_secret_'))return 'secret';
 if(/^sb_publishable_[A-Za-z0-9_-]{16,}$/.test(key))return 'public';
 try{
  if(!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(key))return 'invalid';
  const part=key.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');
  const payload=JSON.parse(atob(part+'='.repeat((4-part.length%4)%4))) as {role?:unknown};
  return payload.role==='service_role'?'secret':payload.role==='anon'?'public':'invalid';
 }catch{return 'invalid';}
}

export function validateBuildConfig(env:Environment):BuildConfigResult{
 const url=env.VITE_SUPABASE_URL?.trim()??'';const key=env.VITE_SUPABASE_ANON_KEY?.trim()??'';
 const requested=env.VITE_BACKEND_MODE|| (url&&key?'supabase':'demo');
 const errors:ConfigIssue[]=[];const warnings:ConfigIssue[]=[];
 const mode=requested==='supabase'||requested==='local'?requested:'demo';
 const error=(code:string,message:string)=>errors.push({code,message});
 if(!['demo','local','supabase'].includes(requested))error('INVALID_BACKEND','VITE_BACKEND_MODE must be demo, local or supabase.');
 const base=env.VITE_BASE_PATH||'/';
 if(!/^\/(?:[A-Za-z0-9_.-]+\/)*$/.test(base)||base.includes('..'))error('INVALID_BASE','VITE_BASE_PATH must be a root-relative directory such as /LifeCity3D/.');
 const router=env.VITE_ROUTER_MODE||'browser';
 if(!['browser','hash'].includes(router))error('INVALID_ROUTER','VITE_ROUTER_MODE must be browser or hash.');
 if(router==='hash'&&mode!=='demo')error('ACCOUNT_HASH_ROUTING','Configured accounts require browser routing.');
 if(Object.keys(env).some(name=>/^VITE_.*(?:SERVICE_ROLE|PRIVATE_KEY|SECRET)/i.test(name)&&env[name]))error('PRIVATE_BROWSER_VARIABLE','Do not place private credentials in VITE_ variables.');
 if(key){const kind=publicKeyKind(key);if(kind==='secret')error('PRIVATE_SUPABASE_KEY','Use only a public anon or publishable Supabase key in the frontend.');else if(kind==='invalid')error('INVALID_PUBLIC_KEY','The Supabase public key format is invalid.');}
 if(url){try{const target=new URL(url);if(target.protocol!=='https:'||target.username||target.password||target.search||target.hash||!['','/'].includes(target.pathname))throw new Error();}catch{error('INVALID_SUPABASE_URL','VITE_SUPABASE_URL must be the HTTPS project origin without credentials, query or path.');}}
 if(mode==='supabase'&&(!url||!key))error('MISSING_CLOUD_CONFIG','Supabase mode requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
 if(env.NEXT_PUBLIC_SUPABASE_URL||env.NEXT_PUBLIC_SUPABASE_ANON_KEY)warnings.push({code:'TEMPLATE_ENV_NAMES',message:'The linked Next.js reference uses NEXT_PUBLIC_ names; configure the documented VITE_ equivalents for LifeCity.'});
 return {mode,errors,warnings};
}
