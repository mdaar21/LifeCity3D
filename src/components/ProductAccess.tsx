import {useState} from 'react';
import {LockKeyhole,Check} from 'lucide-react';
import {useGame} from '../lib/game';
import {useLocale} from '../lib/locale';
import {useTerritory} from '../lib/useTerritory';
import {levelFromXp,requiredLevel} from '../../supabase/functions/_shared/product-unlocks';
import {AssetThumbnail} from './AssetThumbnail';
import {Modal} from './Common';
export function useProductGate(){
 const {state}=useGame(),{realm}=useTerritory(),{t,number}=useLocale();
 const level=levelFromXp(Math.max(state?.wallet.player_xp??0,realm==='main'?state?.wallet.city_xp??0:state?.v6?.yuyi_world.city_xp??0));
 const [preview,setPreview]=useState<{key:string;name:string;asset:string}|null>(null);
 const locked=(key:string)=>level<requiredLevel(key);
 return {level,locked,guard:(key:string,name:string,asset:string,run:()=>void)=>{if(locked(key))setPreview({key,name,asset});else run();},
 modal:<Modal open={!!preview} onClose={()=>setPreview(null)} title={preview?.name??''}>{preview&&<div className="product-locked-preview"><AssetThumbnail assetKey={preview.asset}/><LockKeyhole/><h3>{t('يفتح في المستوى','Unlocks at level')} {number(requiredLevel(preview.key))}</h3><p>{t('تقدّم بالمهام والدراسة. بعد الفتح، تشتريه من رصيدك المكتسب.','Progress through tasks and study. After unlocking, buy it with earned coins.')}</p></div>}</Modal>};
}
export function AccessLabel({product,level}:{product:string;level:number}){const {t,number}=useLocale(),required=requiredLevel(product),locked=level<required;return <span className={'product-access '+(locked?'locked':'available')} data-required-level={required}>{locked?<LockKeyhole size={14}/>:<Check size={14}/>} {t('مستوى','Level')} {number(required)}{locked?' · '+t('معاينة متاحة','Preview available'):''}</span>;}
