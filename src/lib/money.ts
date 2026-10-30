/** Exact decimal arithmetic for requests/quotes. Intl handles presentation only. */
function decimal(value:string|number){const s=String(value);const m=/^(-?)(\d+)(?:\.(\d+))?$/.exec(s);if(!m)throw new Error('INVALID_AMOUNT');const fraction=m[3]??'';return {n:BigInt((m[1]||'')+m[2]+fraction),scale:fraction.length};}
export function fixed(value:string|number,digits=4):bigint{const d=decimal(value);if(d.scale>digits){const divisor=10n**BigInt(d.scale-digits);if(d.n%divisor!==0n)throw new Error('INVALID_AMOUNT');return d.n/divisor;}return d.n*10n**BigInt(digits-d.scale);}
export function decimalString(n:bigint,digits=4){const sign=n<0n?'-':'';const abs=n<0n?-n:n;const scale=10n**BigInt(digits);return `${sign}${abs/scale}${digits?'.'+(abs%scale).toString().padStart(digits,'0'):''}`;}
export function addMoney(a:string|number,b:string|number){return decimalString(fixed(a)+fixed(b));}
export function convertMoney(value:string|number,rate:string,digits:number):string{const a=decimal(value),r=decimal(rate);if(r.n<=0n)throw new Error('FX_UNAVAILABLE');const n=a.n*r.n*10n**BigInt(digits),divisor=10n**BigInt(a.scale+r.scale);const sign=n<0n?-1n:1n;const abs=n<0n?-n:n;return decimalString(sign*((abs+divisor/2n)/divisor),digits);}
export function moneyLabel(value:string|number,currency:string,rate:string,locale:string,precision?:number){const formatter=new Intl.NumberFormat(locale,{style:'currency',currency,...(precision===undefined?{}:{maximumFractionDigits:precision})});const converted=convertMoney(value,rate,formatter.resolvedOptions().maximumFractionDigits??2);
 // Modern Intl accepts a decimal string as an exact mathematical value. TS's
 // older signature still lists number|bigint; no binary money arithmetic occurs.
 return formatter.format(converted as unknown as number);
}
