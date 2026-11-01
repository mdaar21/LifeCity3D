import type {Archetype} from './world-types.ts';

/** Canonical SAR prices for a complete basic building, not just its foundation.
 * Paid changes, furniture and land remain separately quoted. */
export const BUILDING_CATALOG:Record<Archetype,{ar:string;en:string;group:'homes'|'commerce'|'hospitality'|'education'|'health'|'services';width:number;depth:number;price:number;wall:string;roof:string}>= {
 house:{ar:'منزل صغير',en:'Small house',group:'homes',width:8,depth:12,price:800,wall:'#e8dfcb',roof:'#a96347'},
 villa:{ar:'فيلا',en:'Villa',group:'homes',width:10,depth:12,price:2200,wall:'#f0e8d6',roof:'#b97450'},
 restaurant:{ar:'مطعم ومقهى',en:'Restaurant & café',group:'commerce',width:10,depth:10,price:2800,wall:'#dfc9a7',roof:'#775b47'},
 mall:{ar:'مجمع تجاري',en:'Shopping mall',group:'commerce',width:14,depth:12,price:14000,wall:'#dbdacf',roof:'#73969b'},
 hotel:{ar:'فندق',en:'Hotel',group:'hospitality',width:10,depth:14,price:18000,wall:'#e0d2ba',roof:'#6b7f83'},
 resort:{ar:'منتجع',en:'Resort',group:'hospitality',width:14,depth:14,price:40000,wall:'#ece2c7',roof:'#b38b5e'},
 school:{ar:'مدرسة',en:'School',group:'education',width:12,depth:12,price:6500,wall:'#e1d6ba',roof:'#658995'},
 university:{ar:'جامعة',en:'University',group:'education',width:12,depth:14,price:32000,wall:'#d8c9ac',roof:'#6d867c'},
 clinic:{ar:'عيادة',en:'Clinic',group:'health',width:10,depth:10,price:4200,wall:'#e6eee5',roof:'#709e94'},
 hospital:{ar:'مستشفى',en:'Hospital',group:'health',width:12,depth:14,price:24000,wall:'#e3e9e4',roof:'#728e9d'},
 garage:{ar:'مرآب',en:'Garage',group:'services',width:10,depth:8,price:1200,wall:'#b8c0b9',roof:'#6a7476'},
 museum:{ar:'متحف',en:'Museum',group:'services',width:12,depth:12,price:10000,wall:'#ded1b6',roof:'#927a60'},
 office:{ar:'مكاتب',en:'Offices',group:'services',width:10,depth:12,price:8000,wall:'#c4d6d3',roof:'#526f7c'},
};

export const BUILDING_GROUPS=[
 {id:'homes',ar:'المساكن',en:'Homes'}, {id:'commerce',ar:'التجارة والمطاعم',en:'Shops & dining'},
 {id:'hospitality',ar:'الضيافة',en:'Hospitality'}, {id:'education',ar:'التعليم',en:'Education'},
 {id:'health',ar:'الصحة',en:'Healthcare'}, {id:'services',ar:'العمل والخدمات',en:'Work & services'},
] as const;
