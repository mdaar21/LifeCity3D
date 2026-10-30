import {describe,expect,it,vi} from 'vitest';
import {addMoney,convertMoney,fixed,moneyLabel} from '../../src/lib/money';
import {fetchFx,validateFx} from '../../supabase/functions/_shared/fx';
const now=Date.parse('2026-10-31T00:00:00Z');
const rates={result:'success',provider:'https://www.exchangerate-api.com',base_code:'SAR',time_last_update_unix:now/1000,time_next_update_unix:now/1000+86400,rates:{SAR:1,MAD:2.625,USD:.2666666667,EUR:.25,KWD:.0812}};
describe('fixed point quote/display math',()=>{
 it('keeps decimal MAD and half-cent refunds exact without revaluing canonical money',()=>{expect(addMoney('80.25','-35')).toBe('45.2500');expect(addMoney('0.01','0.005')).toBe('0.0150');expect(fixed('999999999.99')).toBe(9999999999900n);expect(()=>fixed('0.00001')).toThrow();expect(convertMoney('20','2.625',2)).toBe('52.50');expect(convertMoney('20','0.2666666667',2)).toBe('5.33');expect(convertMoney('20','0.25',2)).toBe('5.00');});
 it('rounds only presentation, never the saved canonical amount',()=>{const canonical='0.005';expect(convertMoney(canonical,'1',2)).toBe('0.01');expect(canonical).toBe('0.005');expect(moneyLabel('0.005','MAD','1','en',4)).toContain('0.005');expect(moneyLabel('1234567890.25','MAD','1','en')).toContain('1,234,567,890.25');});
});
describe('server-side reference FX validation',()=>{
 it('keeps genuine provider timestamps and supported game pairs',()=>{const valid=validateFx(rates,now);expect(valid.rates.MAD).toBe(2.625);expect(valid.provider).toBe(rates.provider);expect(valid.time_last_update_unix).toBe(now/1000);});
 it('rejects wrong provider/base, missing pairs, non-finite, future and stale data',()=>{for(const data of [{...rates,provider:'fake'},{...rates,base_code:'USD'},{...rates,rates:{SAR:1}},{...rates,rates:{...rates.rates,MAD:Infinity}},{...rates,time_last_update_unix:now/1000+3600},{...rates,time_last_update_unix:now/1000-49*3600}])expect(()=>validateFx(data,now)).toThrow();});
 it('fails closed on upstream failure and does not invent a fallback rate',async()=>{const fake=vi.fn().mockResolvedValue(new Response('rate limited',{status:429}));await expect(fetchFx(fake as typeof fetch)).rejects.toThrow('FX_UNAVAILABLE');});
});
