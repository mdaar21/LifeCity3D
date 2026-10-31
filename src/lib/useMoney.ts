import {useGame} from './game';
import {useLocale} from './locale';
import {moneyLabel,fixed} from './money';
import type {Territory} from './v6-types';
export function useMoney(){const {state}=useGame();const {language,t}=useLocale();const currency=state?.v6?.display_currency??'SAR';const fx=state?.v6?.fx;
 const format=(value:string|number,realm:Territory='main',alreadyMad=false)=>{const code=realm==='yuyi'?'MAD':currency;const rate=realm==='yuyi'?(alreadyMad?'1':fx?.mad_rate):code==='SAR'?'1':fx?.display_rate;if(!rate)return t('سعر التحويل غير متاح','FX unavailable');return moneyLabel(value,code,rate,language+'-u-nu-'+(state?.profile.digits==='local'&&language==='ar-SA'?'arab':'latn'),((alreadyMad||code==='SAR')&&fixed(value)%100n!==0n)?4:undefined);};
 return {currency,fx,format};}
