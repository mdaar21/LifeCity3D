import type {CatalogItem} from './types';
/** One public taxonomy. Old IDs remain usable for owned items and historical receipts. */
export const SHOP_SECTIONS=[
 {id:'construction',ar:'المباني والأبراج',en:'Buildings & towers'},
 {id:'roads',ar:'الطرق والإنارة',en:'Roads & lighting'},
 {id:'vehicles',ar:'السيارات',en:'Cars'},
 {id:'plants',ar:'الطبيعة والزراعة',en:'Plants & farming'},
 {id:'furniture',ar:'الأثاث',en:'Furniture'},
 {id:'water',ar:'المياه والشواطئ',en:'Water & coast'},
] as const;
export type ShopSection=typeof SHOP_SECTIONS[number]['id'];
export function legacyShopSection(item:CatalogItem):ShopSection{
 if(item.category==='homes'||item.category==='landmarks')return 'construction';
 if(item.category==='nature')return 'plants';
 if(item.category==='water')return 'water';
 if(item.category==='vehicles')return 'vehicles';
 if(item.category==='furniture')return 'furniture';return 'roads';
}
export const legacyOffSale=(id:string)=>id==='skyscraper';
export function shopSection(value:string|null):ShopSection{
 if(value==='projects')return 'construction';
 if(value==='items'||value==='nature')return 'plants';
 return SHOP_SECTIONS.some(s=>s.id===value)?value as ShopSection:'construction';
}
