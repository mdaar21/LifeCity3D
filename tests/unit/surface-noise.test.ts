import {describe,it,expect} from 'vitest';
import {surfaceNoise,surfaceNoiseMap} from '../../src/world/surface-noise';
describe('cached generated material texture',()=>{
 it('tiles continuously across positive and negative world coordinates',()=>{for(const [x,y]of [[.2,1.9],[-4.6,-.01],[15.99,16.001]]){const n=surfaceNoise(x,y);expect(n).toBeGreaterThanOrEqual(0);expect(n).toBeLessThanOrEqual(1);expect(surfaceNoise(x+16,y-32)).toBeCloseTo(n,10);}expect(Math.abs(surfaceNoise(16.00001,4)-surfaceNoise(15.99999,4))).toBeLessThan(.00001);});
 it('reuses a small power-of-two mipmapped map across all materials instead of allocating per mesh',()=>{const a=surfaceNoiseMap(),b=surfaceNoiseMap();expect(a).toBe(b);expect(a.image.width).toBe(128);expect(a.image.data!.byteLength).toBe(65536);expect(a.generateMipmaps).toBe(true);expect(a.image.data![3]).toBe(255);});
});
