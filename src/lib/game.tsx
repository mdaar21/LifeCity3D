import {createContext,useCallback,useContext,useEffect,useMemo,useRef,useState} from 'react';
import type {ReactNode} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {getApi,configuredMode} from './api';
import {enterGuest} from './demo';
import {ApiError,errorCode,localizeError} from './errors';
import {readRecord,removeRecord,removePrefix,writeRecord} from './storage';
import {useLocale} from './locale';
import type {BackendMode,CommandResponse,GameSnapshot,SessionUser} from './types';

interface AuthContextValue {user:SessionUser|null;loading:boolean;mode:BackendMode;signIn:(email:string,password:string)=>Promise<SessionUser>;signUp:(email:string,password:string,name:string)=>Promise<{user:SessionUser|null;confirmation_required:boolean}>;signOut:()=>Promise<void>;resetPassword:(email:string)=>Promise<void>;updatePassword:(password:string)=>Promise<void>;enterDemo:()=>Promise<void>}
interface GameContextValue {state:GameSnapshot|null;loading:boolean;error:string|null;mode:BackendMode;saveStatus:'saved'|'saving'|'offline'|'conflict';online:boolean;mutate:(action:string,payload?:Record<string,unknown>)=>Promise<CommandResponse>;refresh:()=>Promise<void>}
const AuthContext=createContext<AuthContextValue|null>(null);const GameContext=createContext<GameContextValue|null>(null);
function initialMode(){try{return sessionStorage.getItem('lifecity-guest')==='true'?'demo':configuredMode;}catch{return configuredMode;}}
export function GameProvider({children}:{children:ReactNode}){
 const [mode,setMode]=useState<BackendMode>(initialMode);const api=useMemo(()=>getApi(mode),[mode]);const accountApi=useMemo(()=>getApi(configuredMode),[]);
 const [user,setUser]=useState<SessionUser|null>(null);const [authLoading,setAuthLoading]=useState(true);
 const [online,setOnline]=useState(navigator.onLine);const [saveStatus,setSaveStatus]=useState<GameContextValue['saveStatus']>('saved');const [commandError,setCommandError]=useState<unknown>(null);
 const queryClient=useQueryClient();const locale=useLocale();const {applyProfile}=locale;const queue=useRef<Promise<unknown>>(Promise.resolve());const pending=useRef(new Map<string,string>());const generation=useRef(0);
 const queryKey=useMemo(()=>['game',mode,user?.id??'none'],[mode,user?.id]);const cacheKey='cache:'+mode+':'+(user?.id??'none');
 useEffect(()=>{let current=true;setAuthLoading(true);void (async()=>{try{if(await readRecord<boolean>('logout-pending:'+api.mode)){if(navigator.onLine)await api.signOut().then(()=>removeRecord('logout-pending:'+api.mode)).catch(()=>{});if(current)setUser(null);return;}if(!navigator.onLine&&api.mode!=='demo'){const cached=await readRecord<{user:SessionUser;at:number}>('identity:'+api.mode);if(current)setUser(cached&&Date.now()-cached.at<86400000?cached.user:null);return;}const next=await api.getUser();if(next)void writeRecord('identity:'+api.mode,{user:next,at:Date.now()}).catch(()=>{});else void removeRecord('identity:'+api.mode).catch(()=>{});if(current)setUser(next);}catch{if(current)setUser(null);}finally{if(current)setAuthLoading(false);}})();return()=>{current=false;};},[api]);
 useEffect(()=>{const yes=()=>setOnline(true),no=()=>{setOnline(false);setSaveStatus('offline');};addEventListener('online',yes);addEventListener('offline',no);return()=>{removeEventListener('online',yes);removeEventListener('offline',no);};},[]);
 const query=useQuery({queryKey,enabled:!!user,networkMode:'always',queryFn:async()=>{
  const started=generation.current;try{const state=await api.getState();if(started===generation.current)void writeRecord(cacheKey,state).catch(()=>{});return state;}catch(e){if(!navigator.onLine||errorCode(e)==='NETWORK_ERROR'){const cached=await readRecord<GameSnapshot>(cacheKey).catch(()=>null);if(cached)return cached;}throw e;}
 },refetchInterval:10000,refetchOnWindowFocus:true,retry:1,staleTime:2000});
 const refresh=useCallback(async()=>{const r=await queryClient.fetchQuery({queryKey,queryFn:()=>api.getState(),staleTime:0});void writeRecord(cacheKey,r).catch(()=>{});setCommandError(null);setSaveStatus(navigator.onLine?'saved':'offline');},[queryClient,queryKey,api,cacheKey]);
 const mutate=useCallback((action:string,payload:Record<string,unknown>={}):Promise<CommandResponse>=>{
  const execute=async()=>{
   if(!navigator.onLine){setSaveStatus('offline');throw new ApiError('OFFLINE');}const started=generation.current;
   const fingerprint=action+':'+JSON.stringify(payload);const recordKey='pending:'+cacheKey+':'+fingerprint;
   const key=pending.current.get(fingerprint)??await readRecord<string>(recordKey).catch(()=>null)??crypto.randomUUID();pending.current.set(fingerprint,key);await writeRecord(recordKey,key);
   setSaveStatus('saving');setCommandError(null);await queryClient.cancelQueries({queryKey});
   try{
    const response=await api.command(action,payload,key);await queryClient.cancelQueries({queryKey});
    pending.current.delete(fingerprint);await removeRecord(recordKey);
    if(started!==generation.current)return response;
    if(response.state){queryClient.setQueryData(queryKey,response.state);void writeRecord(cacheKey,response.state).catch(()=>{});}
    else if(action==='delete_account'){generation.current++;queryClient.removeQueries({queryKey});await removeRecord(cacheKey);await removeRecord('identity:'+api.mode);setUser(null);}
    setSaveStatus('saved');return response;
   }catch(e){
    // Uncertain network delivery retains ONLY the retry key, never an offline
    // command queue. No automatic financial write is performed after reconnect.
    const code=errorCode(e);if(code!=='NETWORK_ERROR'&&code!=='OFFLINE'){pending.current.delete(fingerprint);await removeRecord(recordKey);}
    setCommandError(e);setSaveStatus(code==='OFFLINE'?'offline':'conflict');void queryClient.invalidateQueries({queryKey});throw e;
   }
  };
  const result=queue.current.then(execute,execute);queue.current=result.catch(()=>{});return result;
 },[api,cacheKey,queryClient,queryKey]);
 useEffect(()=>{if(!user||!api.subscribe)return;return api.subscribe(()=>{void queryClient.invalidateQueries({queryKey});});},[api,user,queryClient,queryKey]);
 const profile=query.data?.profile;
 useEffect(()=>{if(!profile)return;const bound=generation.current;applyProfile(profile,language=>{if(bound===generation.current&&language!==profile.language)void mutate('profile_update',{language}).catch(()=>{});});},[profile,applyProfile,mutate]);
 const adopt=useCallback((next:SessionUser|null)=>{generation.current++;setMode(configuredMode);if(next)void writeRecord('identity:'+configuredMode,{user:next,at:Date.now()}).catch(()=>{});try{sessionStorage.removeItem('lifecity-guest');}catch{/* Session preference only. */}setUser(next);setCommandError(null);setSaveStatus('saved');},[]);
 const flushLogout=useCallback(async()=>{if(await readRecord<boolean>('logout-pending:'+configuredMode)){await accountApi.signOut();await removeRecord('logout-pending:'+configuredMode);}},[accountApi]);
 const auth=useMemo<AuthContextValue>(()=>({user,loading:authLoading,mode:configuredMode,
  signIn:async(email,password)=>{await flushLogout();const next=await accountApi.signIn(email,password);adopt(next);return next;},
  signUp:async(email,password,name)=>{await flushLogout();const result=await accountApi.signUp(email,password,name);adopt(result.user);return result;},
  signOut:async()=>{generation.current++;await queryClient.cancelQueries({queryKey:['game']});await writeRecord('logout-pending:'+api.mode,true);try{await api.signOut();await removeRecord('logout-pending:'+api.mode);}finally{await removeRecord(cacheKey).catch(()=>{});await removePrefix('pending:'+cacheKey+':').catch(()=>{});await removeRecord('identity:'+api.mode).catch(()=>{});queryClient.removeQueries({queryKey:['game']});pending.current.clear();setUser(null);setCommandError(null);}},
  resetPassword:email=>accountApi.resetPassword(email),updatePassword:password=>accountApi.updatePassword(password),
  enterDemo:async()=>{generation.current++;const guest=await enterGuest();try{sessionStorage.setItem('lifecity-guest','true');}catch{/* Guest city remains in IndexedDB. */}setMode('demo');setUser(guest);setCommandError(null);setSaveStatus('saved');}
 }),[user,authLoading,accountApi,adopt,api,cacheKey,queryClient,flushLogout]);
 const game=useMemo<GameContextValue>(()=>({state:query.data??null,loading:authLoading||query.isPending,error:commandError?localizeError(commandError,locale.language):query.error?localizeError(query.error,locale.language):null,mode,saveStatus:online?saveStatus:'offline',online,mutate,refresh}),[query.data,query.isPending,query.error,authLoading,commandError,locale.language,mode,saveStatus,online,mutate,refresh]);
 return <AuthContext.Provider value={auth}><GameContext.Provider value={game}>{children}</GameContext.Provider></AuthContext.Provider>;
}
export function useGame(){const v=useContext(GameContext);if(!v)throw new Error('GameProvider missing');return v;}
export function useAuth(){const v=useContext(AuthContext);if(!v)throw new Error('GameProvider missing');return v;}
