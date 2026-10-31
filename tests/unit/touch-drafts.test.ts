import {beforeEach,expect,it} from 'vitest';
import {useTouchTools} from '../../src/world/useTouchTools';
import {snapPoint} from '../../src/world/touch-adapter';
beforeEach(()=>{useTouchTools.getState().cancel();});
it('keeps a drag as one reversible draft step, with redo and cancel bounded to previews',()=>{const s=useTouchTools.getState();s.begin({operation:'vegetation_buy',request:{item:'agave'},x:1,z:1,width:1,depth:1,rotation:0});s.checkpoint();for(let x=2;x<=15;x++)s.edit({x},false);expect(useTouchTools.getState().past).toHaveLength(1);s.undo();expect(useTouchTools.getState().draft?.x).toBe(1);s.redo();expect(useTouchTools.getState().draft?.x).toBe(15);s.cancel();expect(useTouchTools.getState().draft).toBeNull();expect(useTouchTools.getState().preview).toBeNull();expect(useTouchTools.getState().past).toHaveLength(0);});
it('snaps without mirroring world coordinates for RTL',()=>{expect(snapPoint({x:3.32,z:5.81},.5)).toEqual({x:3.5,z:6});expect(snapPoint({x:3.32,z:5.81},1)).toEqual({x:3,z:6});});
