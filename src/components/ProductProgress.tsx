import {useEffect,useRef,useState} from 'react';
import {Sparkles,X} from 'lucide-react';
import {useGame} from '../lib/game';
import {useLocale} from '../lib/locale';
import {PROGRESS_PRODUCTS,nextProducts} from '../lib/product-progress';
import type {ShopSection} from '../lib/shop-catalog';
import {levelFromXp} from '../../supabase/functions/_shared/product-unlocks';
import {AssetThumbnail} from './AssetThumbnail';
export function NextProducts({level,section}:{level:number;section:ShopSection}){const {t,number}=useLocale(),next=nextProducts(level,section);return <aside className="next-products" data-testid="next-products"><strong><Sparkles size={17}/>{next.level?t('القادم في المستوى','Next at level')+' '+number(next.level):t('فتحت تنوع هذا القسم بالكامل','This collection is fully unlocked')}</strong>{next.products.length>0&&<div>{[...new Map(next.products.map(p=>[p.ar,p])).values()].map(p=><span key={p.key}><AssetThumbnail assetKey={p.asset}/>{t(p.ar,p.en)}</span>)}</div>}<small>{t('الفتح يتيح الشراء من رصيدك. خبرة المهام أو تطوير مدينتك تتقدم بك، حتى المستوى ٤٠.','Unlocks enable purchases with earned coins. Task XP or city development advances you, up to level 40.')}</small></aside>;}
export function UnlockToast(){const {state}=useGame(),{t,number}=useLocale(),level=state?levelFromXp(Math.max(state.wallet.player_xp,state.wallet.city_xp)):null,last=useRef<number|null>(null),[crossed,setCrossed]=useState<{from:number;to:number}|null>(null);
 useEffect(()=>{if(level===null)return;const old=last.current;last.current=level;if(old!==null&&level>old)requestAnimationFrame(()=>setCrossed({from:old,to:level}));},[level]);
 useEffect(()=>{if(!crossed)return;const id=setTimeout(()=>setCrossed(null),7000);return()=>clearTimeout(id);},[crossed]);
 if(!crossed)return null;const count=PROGRESS_PRODUCTS.filter(p=>p.level>crossed.from&&p.level<=crossed.to).length;return <aside className="unlock-toast" role="status" data-testid="unlock-toast"><Sparkles/><div><strong>{t('وصلت للمستوى','You reached level')} {number(crossed.to)}</strong><p>{count?t('منتجات جديدة متاحة للشراء:','New products available to buy:')+' '+number(count):t('مدينتك تتقدم معك','Your city progresses with you')}</p></div><button aria-label={t('إغلاق','Close')} onClick={()=>setCrossed(null)}><X/></button></aside>;
}
