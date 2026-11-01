import {describe,it,expect} from 'vitest';
import {palmGeometry} from '../../src/world/palm-geometry';
import {furnitureGeometry} from '../../src/world/FurnitureAsset';
import {FURNITURE} from '../../supabase/functions/_shared/world-commerce';
import {MATERIALS} from '../../supabase/functions/_shared/world-planner';
describe('richer owned assets keep their paid placement contracts',()=>{
 it('keeps every furniture model inside its authoritative footprint for all materials',()=>{
  for(const f of FURNITURE)for(const material of MATERIALS){const g=furnitureGeometry(f.id,f.width,f.depth,material.color);g.computeBoundingBox();const b=g.boundingBox!;expect(Math.max(Math.abs(b.min.x),Math.abs(b.max.x))).toBeLessThanOrEqual(f.width/2+.00001);expect(Math.max(Math.abs(b.min.z),Math.abs(b.max.z))).toBeLessThanOrEqual(f.depth/2+.00001);expect(g.attributes.position.count/3).toBeLessThan(1500);expect([...g.attributes.position.array].every(Number.isFinite)).toBe(true);}
 });
 it('gives low-detail palms a smaller finite mesh without changing their height',()=>{
  for(const family of ['date','fan','coconut','royal']){const low=palmGeometry(family,false),high=palmGeometry(family,true);low.computeBoundingBox();high.computeBoundingBox();expect(low.attributes.position.count).toBeLessThan(high.attributes.position.count);expect(low.attributes.position.count/3).toBeLessThan(2000);expect(high.attributes.position.count/3).toBeLessThan(4000);expect(low.boundingBox!.max.y).toBeCloseTo(high.boundingBox!.max.y,1);expect([...high.attributes.position.array].every(Number.isFinite)).toBe(true);low.dispose();high.dispose();}
 });
});
