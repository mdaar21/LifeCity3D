import {createContext,useCallback,useContext,useEffect,useMemo,useRef,useState} from 'react';
import type {ReactNode} from 'react';
import type {Language,Profile} from './types';
interface Locale {language:Language;dir:'rtl'|'ltr';t:(ar:string,en:string)=>string;number:(n:number,options?:Intl.NumberFormatOptions)=>string;date:(date:string|Date,options?:Intl.DateTimeFormatOptions)=>string;setLanguage:(language:Language)=>void;applyProfile:(profile:Profile,persist?:(language:Language)=>void)=>void}
const Context=createContext<Locale|null>(null);
export function LocaleProvider({children}:{children:ReactNode}){
 const [language,setLang]=useState<Language>(()=>{try{return localStorage.getItem('lifecity-language')==='en'?'en':'ar-SA';}catch{return 'ar-SA';}});
 const [digits,setDigits]=useState<Profile['digits']>('latin');const [timezone,setTimezone]=useState('Asia/Riyadh');
 const persist=useRef<((language:Language)=>void)|undefined>(undefined);
 const setLanguage=useCallback((next:Language)=>{setLang(next);try{localStorage.setItem('lifecity-language',next);}catch{/* UI preference only; account persistence still attempted. */}persist.current?.(next);},[]);
 const applyProfile=useCallback((profile:Profile,callback?:(language:Language)=>void)=>{setLang(profile.language);setDigits(profile.digits);setTimezone(profile.timezone);persist.current=callback;const dark=profile.theme==='dark'||(profile.theme==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=dark?'dark':'light';},[]);
 useEffect(()=>{document.documentElement.lang=language;document.documentElement.dir=language==='en'?'ltr':'rtl';},[language]);
 const value=useMemo<Locale>(()=>({language,dir:language==='en'?'ltr':'rtl',t:(ar,en)=>language==='en'?en:ar,number:(n,options)=>new Intl.NumberFormat(language+'-u-nu-'+(digits==='local'&&language==='ar-SA'?'arab':'latn'),options).format(n),date:(date,options)=>{try{return new Intl.DateTimeFormat(language,{timeZone:timezone,numberingSystem:digits==='local'&&language==='ar-SA'?'arab':'latn',...(!options?{year:'numeric',month:'short',day:'numeric'} as const:{}),...options}).format(new Date(date));}catch{return String(date);}},setLanguage,applyProfile}),[language,digits,timezone,setLanguage,applyProfile]);
 return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useLocale(){const v=useContext(Context);if(!v)throw new Error('LocaleProvider missing');return v;}
