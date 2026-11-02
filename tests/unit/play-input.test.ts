import {it,expect} from 'vitest';
import {walkingVector,damping,zoomDistance} from '../../src/world/play-input';
it('moves orthogonally to camera forward, normalizes diagonals and keeps forward/back/left/right independent of facing rotation',()=>{
 for(const yaw of [0,.7,Math.PI/2,Math.PI]){const w=walkingVector(1,0,yaw),s=walkingVector(-1,0,yaw),a=walkingVector(0,1,yaw),d=walkingVector(0,-1,yaw),diagonal=walkingVector(1,1,yaw);expect(w.x*a.x+w.z*a.z).toBeCloseTo(0);expect(w.x+s.x).toBeCloseTo(0);expect(a.z+d.z).toBeCloseTo(0);expect(Math.hypot(diagonal.x,diagonal.z)).toBeCloseTo(1);expect(Math.hypot(a.x,a.z)).toBeCloseTo(1);}
 expect(walkingVector(0,1,0)).toEqual({x:-1,z:0});expect(walkingVector(0,-1,0)).toEqual({x:1,z:0});
});
it('uses frame-independent exponential damping and clamps wheel/pinch target ranges',()=>{let x=0,y=0;for(let i=0;i<60;i++)x+=(4-x)*damping(9,1/60);for(let i=0;i<120;i++)y+=(4-y)*damping(9,1/120);expect(x).toBeCloseTo(y,10);expect(x).toBeLessThan(4);expect(zoomDistance(18,300)).toBe(18);expect(zoomDistance(1.8,-300)).toBe(1.8);expect(zoomDistance(4,120)).toBeGreaterThan(4);});
