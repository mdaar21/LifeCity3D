/** ExchangeRate-API open access: daily reference data, attribution required,
 * cache permitted for personal/commercial conversion, no rate redistribution.
 * We keep data private and return game quote metadata, not a public rates API. */
export const FX_SOURCE='https://open.er-api.com/v6/latest/SAR';
export const GAME_CURRENCIES=['SAR','AED','KWD','QAR','BHD','OMR','YER','IQD','JOD','LBP','SYP','EGP','SDG','LYD','TND','DZD','MAD','MRU','SOS','DJF','KMF','ILS','USD','EUR'] as const;
export interface ProviderRates {result:'success';provider:'https://www.exchangerate-api.com';base_code:'SAR';time_last_update_unix:number;time_next_update_unix:number;rates:Record<string,number>}
export function validateFx(input:unknown,now=Date.now()):ProviderRates {
 if(!input||typeof input!=='object')throw new Error('FX_INVALID');
 const v=input as Record<string,unknown>;
 if(v.result!=='success'||v.base_code!=='SAR'||v.provider!=='https://www.exchangerate-api.com'||typeof v.time_last_update_unix!=='number'||typeof v.time_next_update_unix!=='number'||!v.rates||typeof v.rates!=='object')throw new Error('FX_INVALID');
 if(v.time_last_update_unix*1000>now+300_000||now-v.time_last_update_unix*1000>48*3600_000||v.time_next_update_unix<=v.time_last_update_unix)throw new Error('FX_STALE');
 const rates:Record<string,number>={};
 for(const code of GAME_CURRENCIES){const n=(v.rates as Record<string,unknown>)[code];if(n===undefined)continue;if(typeof n!=='number'||!Number.isFinite(n)||n<1e-9||n>1e9)throw new Error('FX_INVALID');rates[code]=n;}
 if(rates.SAR!==1||!rates.MAD||!rates.USD||!rates.EUR)throw new Error('FX_INVALID');
 return {result:'success',provider:'https://www.exchangerate-api.com',base_code:'SAR',time_last_update_unix:v.time_last_update_unix,time_next_update_unix:v.time_next_update_unix,rates};
}
export async function fetchFx(fetcher:typeof fetch=fetch):Promise<ProviderRates>{
 const response=await fetcher(FX_SOURCE,{signal:AbortSignal.timeout(8000)});
 if(!response.ok)throw new Error('FX_UNAVAILABLE');
 if(Number(response.headers.get('content-length'))>65536)throw new Error('FX_INVALID');
 const body=await response.text();if(body.length>65536)throw new Error('FX_INVALID');
 return validateFx(JSON.parse(body));
}
