import {it,expect} from 'vitest';
import {actorCommandPayload} from '../../src/lib/actor-command';
it('lets an explicit camera/actor interaction follow a just-completed queued save without changing its user intent',()=>{
 for(const operation of ['avatar_mode','avatar_enter','avatar_exit','avatar_floor','car_drive','car_exit','car_park']){const payload={operation,request:{realm:'main',mode:'aerial',floor:2},expected_revision:7},next=actorCommandPayload('world_apply',payload,8);expect(next).toEqual({...payload,expected_revision:8});expect(payload.expected_revision).toBe(7);expect(next.request).toBe(payload.request);}
});
it('never rebases financial settlement, quotes, authored asset changes, movement traces or malformed revisions',()=>{
 const payload={operation:'avatar_mode',request:{mode:'aerial'},expected_revision:7};for(const action of ['world_quote','world_commit','purchase','yuyi_purchase'])expect(actorCommandPayload(action,payload,8)).toBe(payload);
 for(const operation of ['avatar_move','car_move','building_move','building_start','building_stage','furniture_place','material_apply']){const p={...payload,operation};expect(actorCommandPayload('world_apply',p,8)).toBe(p);}
 expect(actorCommandPayload('world_apply',payload,undefined)).toBe(payload);expect(actorCommandPayload('world_apply',payload,7)).toBe(payload);const missing={operation:'avatar_mode'};expect(actorCommandPayload('world_apply',missing,8)).toBe(missing);
});
