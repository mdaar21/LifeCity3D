import {describe,it,expect} from 'vitest';
import {CATALOG} from '../../src/lib/catalog';
import {canPlace,footprint,levelFromXp,localDay,PRAYER_REWARDS} from '../../src/lib/rules';
describe('calendar and placement invariants',()=>{
 it('uses the account local day across midnight and DST boundaries',()=>{expect(localDay(new Date('2026-01-01T22:15:00Z'),'Asia/Riyadh')).toBe('2026-01-02');expect(localDay(new Date('2026-03-08T06:59:00Z'),'America/New_York')).toBe('2026-03-08');expect(localDay(new Date('2026-03-08T07:01:00Z'),'America/New_York')).toBe('2026-03-08');expect(localDay(new Date('2026-01-01T01:00:00Z'),'America/Los_Angeles')).toBe('2025-12-31');});
 it('rotates footprints and rejects overlap/off-land without mirroring coordinates',()=>{const bed=CATALOG.find(i=>i.id==='bed')!;expect(footprint(bed,90)).toEqual([2,1]);expect(canPlace(bed,7,7,0,8,[],CATALOG)).toBe(false);expect(canPlace(bed,6,7,90,8,[],CATALOG)).toBe(true);expect(canPlace(bed,1,1,0,8,[{id:'a',inventory_id:'i',catalog_id:'house',x:0,y:0,z:0,rotation:0,version:1}],CATALOG)).toBe(false);expect(canPlace(bed,0,0,45,8,[],CATALOG)).toBe(false);});
 it('keeps XP-based levels separate from spendable coins',()=>{expect(levelFromXp(0)).toBe(1);expect(levelFromXp(100)).toBe(2);expect(levelFromXp(400)).toBe(3);expect(levelFromXp(1600)).toBe(5);expect(PRAYER_REWARDS).toEqual({fajr:30,dhuhr:20,asr:20,maghrib:20,isha:20});});
 it('preserves required catalog prices and unique identifiers',()=>{const prices=Object.fromEntries(CATALOG.map(i=>[i.id,i.price]));expect(prices).toMatchObject({road:10,tree:20,bench:40,car:500,house:800,villa:2500,lake:1500,beach:5000,skyscraper:10000,palace:20000});expect(new Set(CATALOG.map(i=>i.id)).size).toBe(CATALOG.length);});
});
