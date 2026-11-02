import {useEffect,useMemo,useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {Group} from 'three';
import type {Realm,WorldContext} from '../../supabase/functions/_shared/world-types';
import {agentsFor,tickAgents} from '../../supabase/functions/_shared/world-simulation';
import {heightAt,terrainAt} from '../../supabase/functions/_shared/world-math';
import {DEFAULT_APPEARANCE} from '../../supabase/functions/_shared/world-motion';
import {PersonMesh} from './WorldActors';
import {Box} from './WorldGeometry';
import {useWorldUI} from './useWorldUI';
export function WorldLife({context,realm,active}:{context:WorldContext;realm:Realm;active:boolean}){
 const cache=useRef<{key:string;agents:ReturnType<typeof agentsFor>}>({key:'',agents:[]});
 const agents=useMemo(()=>{const key=context.legacy.filter(v=>v.realm===realm).map(v=>v.id+':'+v.x+':'+v.z).join('|')+realm+context.world.settings.quality+context.world.settings.simulate_residents+context.world.entities.filter(e=>['building','node','edge','line','decoration'].includes(e.kind)).map(e=>e.id+e.version+e.status).join('|');if(cache.current.key!==key)cache.current={key,agents:agentsFor(context,realm)};return cache.current.agents;},[context,realm]),refs=useRef(new Map<string,Group>()),acc=useRef(0),invalidate=useThree(s=>s.invalidate),overlay=useWorldUI(s=>s.overlay);
 useEffect(()=>{if(!active||!agents.length)return;let idle=0;const tick=()=>{if(document.hidden)return;const now=Date.now()/1000;if(agents.some(a=>!a.hidden||now>=a.wait_until)||now-idle>=1){invalidate();idle=now;}};tick();const timer=setInterval(tick,context.world.settings.quality==='low'?50:33);return()=>clearInterval(timer);},[active,agents,invalidate,context.world.settings.quality]);
 useFrame((_,delta)=>{if(!active||!agents.length||document.hidden)return;acc.current+=Math.min(.2,delta);if(acc.current>=.1){tickAgents(agents,context,realm,.1,Date.now()/1000);acc.current=0;for(const a of agents){const ref=refs.current.get(a.id);if(!ref)continue;ref.visible=!a.hidden&&(a.kind!=='metro'||overlay==='metro');ref.position.set(a.x,a.kind==='metro'?-4:heightAt(terrainAt(context,realm),a.x,a.z)+.05,a.z);ref.rotation.y=a.heading;}}});
 return <>{agents.map(a=><group key={a.id} ref={ref=>{if(ref)refs.current.set(a.id,ref);else refs.current.delete(a.id);}} visible={!a.hidden&&(a.kind!=='metro'||overlay==='metro')}>{a.kind==='person'?<PersonMesh appearance={{...DEFAULT_APPEARANCE,top:a.color,accessory:'none'}} motionSpeed={()=>a.moving?a.speed:0}/>:<><Box at={[0,.4,0]} size={[a.kind==='car'?1.15:1.6,.65,a.kind==='car'?2.4:4]} color={a.color}/><Box at={[0,.95,0]} size={[a.kind==='car'?1:1.5,.5,a.kind==='car'?1.1:3.2]} color="#9fb5b4"/>{[-1,1].flatMap(x=>[-1,1].map(z=><Box key={x+':'+z} at={[x*.55,.2,z*(a.kind==='car'?.7:1.3)]} size={[.2,.35,.35]} color="#3f5147"/>))}</>}</group>)}</>;
}
