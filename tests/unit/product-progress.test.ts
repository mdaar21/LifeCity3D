import {it,expect} from 'vitest';
import {PRODUCT_UNLOCKS,levelFromXp,requiredLevel} from '../../supabase/functions/_shared/product-unlocks';
import {BUILDING_CATALOG} from '../../supabase/functions/_shared/building-catalog';
import {FURNITURE} from '../../supabase/functions/_shared/world-commerce';
import {CARS} from '../../supabase/functions/_shared/world-motion';
import {VEGETATION,FARM_PLOTS,CROPS} from '../../supabase/functions/_shared/world-horticulture';
import {NODE_CATALOG,DECORATIONS} from '../../supabase/functions/_shared/world-infrastructure';
import {CATALOG} from '../../src/lib/catalog';
import {nextProducts} from '../../src/lib/product-progress';
it('covers every buyable product with deliberate independent schedules and keeps the preserved XP with a bounded progression curve capped at40',()=>{
 const groups={legacy:CATALOG,building:Object.keys(BUILDING_CATALOG).map(id=>({id})),furniture:FURNITURE,car:CARS,vegetation:VEGETATION,farm:FARM_PLOTS,crop:CROPS,node:NODE_CATALOG,decoration:DECORATIONS};
 for(const [prefix,items]of Object.entries(groups))for(const item of items)expect(PRODUCT_UNLOCKS[prefix+':'+item.id]).toBeGreaterThanOrEqual(1);
 expect(Math.max(...Object.values(PRODUCT_UNLOCKS))).toBe(40);expect([0,24,25,38024,38025,1e12].map(levelFromXp)).toEqual([1,1,2,39,40,40]);
 expect(nextProducts(10,'plants').level).toBeNull();expect(nextProducts(15,'furniture').level).toBeNull();expect(nextProducts(20,'vehicles').level).toBeNull();expect(nextProducts(35,'construction').level).toBe(40);
 expect(BUILDING_CATALOG.tower_round.price).toBeGreaterThan(BUILDING_CATALOG.tower_glass.price);expect(requiredLevel('building:tower_round')).toBeLessThan(requiredLevel('building:tower_glass'));
});
