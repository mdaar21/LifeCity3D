import type {WorldContext} from './world-types.ts';
export function worldHour(c:WorldContext):number{
 const s=c.world.settings;if(s.clock==='game')return (Date.parse(c.now)/60000/s.day_minutes*24)%24;
 if(s.clock==='fixed'||s.hour!==null)return s.hour??12;return (new Date(c.now).getUTCHours()+3+new Date(c.now).getUTCMinutes()/60)%24;
}
