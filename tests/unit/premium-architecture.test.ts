import {describe,it,expect} from 'vitest';
import {createHash} from 'node:crypto';
import {premiumArchitecture,type ArchitectureFamily,type ArchitectureStyle} from '../../src/world/premium-architecture';
import {generatePlans,defaultRooms} from '../../supabase/functions/_shared/world-planner';
import {BUILDING_CATALOG,isTower} from '../../supabase/functions/_shared/building-catalog';
import type {Archetype} from '../../supabase/functions/_shared/world-types';
const floor=generatePlans({width:12,depth:12,floors:1,archetype:'house',rooms:defaultRooms('house'),accessible:false,budget:'1000000000'},{x:0,z:0,width:16,depth:16});
const signature=(set:ReturnType<typeof premiumArchitecture>)=>createHash('sha256').update(Object.values(set).map(g=>JSON.stringify(Array.from(g.getAttribute('position').array))).join('|')).digest('hex');
const dispose=(set:ReturnType<typeof premiumArchitecture>)=>Object.values(set).forEach(g=>g.dispose());
describe('premium room-bearing building geometry',()=>{
 it('distinguishes all non-tower architectural programs and three actual geometric styles, even at equal dimensions and rooms',()=>{
  const signatures=new Set<string>();for(const family of [...Object.keys(BUILDING_CATALOG).filter(id=>!isTower(id)),'apartment','palace'] as ArchitectureFamily[]){const variants=new Set<string>();for(const style of ['forest','coastal','desert'] as ArchitectureStyle[]){const g=premiumArchitecture({family,width:12,depth:12,floors:floor,style,finished:true,roofPaid:true});variants.add(signature(g));signatures.add(signature(g));for(const geometry of Object.values(g)){expect([...geometry.getAttribute('position').array].every(Number.isFinite)).toBe(true);if(geometry.getAttribute('position').count){expect(geometry.boundingBox!.min.y).toBeGreaterThanOrEqual(-.00001);expect(geometry.boundingBox!.max.y).toBeLessThanOrEqual(6);expect(geometry.getAttribute('position').count).toBeLessThan(100000);}}dispose(g);}expect(variants.size,family+' must change geometry, not just colors').toBe(3);}expect(signatures.size).toBe(45);
 });
 it('derives walls from actual saved rooms, respects paid finish/roof stages and substantially reduces distant detail',()=>{
  for(const id of Object.keys(BUILDING_CATALOG).filter(id=>!isTower(id)) as Archetype[]){const p=BUILDING_CATALOG[id],floors=generatePlans({...p,floors:1,archetype:id,rooms:defaultRooms(id),accessible:false,budget:'1000000000'},{x:0,z:0,width:16,depth:16}),before=structuredClone(floors),input={family:id as ArchitectureFamily,width:p.width,depth:p.depth,floors,style:'forest' as const,finished:true,roofPaid:true};const full=premiumArchitecture(input),low=premiumArchitecture({...input,low:true}),unfinished=premiumArchitecture({...input,finished:false,roofPaid:false});expect(unfinished.roof.getAttribute('position').count).toBe(0);expect(unfinished.glass.getAttribute('position').count).toBeLessThan(full.glass.getAttribute('position').count);expect(Object.values(low).reduce((n,g)=>n+g.getAttribute('position').count,0)).toBeLessThan(Object.values(full).reduce((n,g)=>n+g.getAttribute('position').count,0));expect(floors).toEqual(before);dispose(full);dispose(low);dispose(unfinished);}
 });
});
