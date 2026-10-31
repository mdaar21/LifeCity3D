import {useShallow} from 'zustand/react/shallow';
import {useEffect,useMemo,useRef,type ComponentRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {OrbitControls,OrthographicCamera,PerspectiveCamera,Line} from '@react-three/drei';
import {Color} from 'three';
import type {GameSnapshot,Placement} from '../lib/types';
import {viewWorldContext} from '../lib/world-state';
import {bounds,heightAt,terrainAt} from '../../supabase/functions/_shared/world-math';
import {worldHour} from '../../supabase/functions/_shared/world-environment';
import {WorldWeather} from './WorldWeather';
import {metrics} from '../../supabase/functions/_shared/world-networks';
import {previewTransition} from '../../supabase/functions/_shared/world-engine';
import type {Realm} from '../../supabase/functions/_shared/world-types';
import {ParcelGround,MeasuredBuilding,NetworkMesh,NodeMesh,DecorationMesh} from './WorldGeometry';
import {AvatarActor,CarActor,PlayController} from './WorldActors';
import {SurpriseRoom} from './SurpriseRoom';
import {WorldLife} from './WorldLife';
import {ProceduralModel} from './ProceduralModel';
import {footprint,type DraftPlacement} from './building';
import {useWorldUI,worldRuntime} from './useWorldUI';
interface Props {game:GameSnapshot;realm:Realm;active:boolean;perspective:boolean;resetKey:number;draft?:DraftPlacement|null;selectedId?:string|null;valid?:boolean;gridVisible?:boolean;onRealm?:(r:Realm)=>void;onSelect?:(p:Placement)=>void;onTile?:(x:number,z:number)=>void}
function MapCamera({width,depth,perspective,resetKey}:{width:number;depth:number;perspective:boolean;resetKey:number}){
 const controls=useRef<ComponentRef<typeof OrbitControls>>(null),{camera,size}=useThree();const extent=Math.max(width,depth),zoom=Math.min(size.width,size.height)/(extent*1.45);
 useEffect(()=>{camera.position.set(extent,extent*.95,-extent);camera.lookAt(0,0,0);controls.current?.target.set(0,0,0);controls.current?.update();},[camera,extent,resetKey,perspective]);
 return <>{perspective?<PerspectiveCamera makeDefault fov={43} near={.08} far={500}/>:<OrthographicCamera makeDefault zoom={zoom} near={.08} far={500}/>}<OrbitControls ref={controls} makeDefault enableDamping minPolarAngle={.15} maxPolarAngle={Math.PI/2.12} minDistance={3} maxDistance={extent*3} minZoom={Math.max(1,zoom*.3)} maxZoom={zoom*8}/></>;
}
export function WorldRealms(props:Props){
 const {game,realm,active,perspective,resetKey,draft,onRealm,onSelect,onTile}=props,ui=useWorldUI(useShallow(s=>({ghost:s.ghost,replay:s.replay,open:s.open,tab:s.tab,selected:s.selected,set:s.set}))),{gl,scene,camera,invalidate,setDpr}=useThree();
 const context=useMemo(()=>{const c=viewWorldContext(game);if(ui.replay)c.world={...c.world,entities:ui.replay.entities};c.world={...c.world,metrics:[metrics(c,'main'),metrics(c,'yuyi')]};return c;},[game,ui.replay]);
 const preview=useMemo(()=>{if(!ui.ghost)return context;const c={...context,world:previewTransition(context,{expected_revision:context.world.revision,legacy_versions:context.legacy_versions,patch:ui.ghost.patch,quote:null,used_quote_id:null,result:ui.ghost.patch.result,refunds:ui.ghost.refunds})};c.world.metrics=[metrics(c,'main'),metrics(c,'yuyi')];return c;},[context,ui.ghost]);
 const extents=(r:Realm)=>{const plots=preview.world.entities.filter(e=>e.kind==='parcel'&&e.realm===r&&e.status==='active').map(e=>e.kind==='parcel'?bounds(e.polygon):{x:0,z:0,width:0,depth:0});return {width:Math.max(context.legacy_sizes[r],...plots.map(v=>v.x+v.width)),depth:Math.max(context.legacy_sizes[r],...plots.map(v=>v.z+v.depth))};};
 const main=extents('main'),yuyi=extents('yuyi'),depth=Math.max(main.depth,yuyi.depth),origin=(r:Realm):[number,number]=>[r==='main'?-main.width-1:1,-depth/2],actor=context.world.entities.find(e=>e.kind==='avatar'&&e.realm===realm&&e.status==='active'),exploring=active&&actor?.kind==='avatar'&&actor.mode!=='aerial';
 const hour=worldHour(context),night=hour<6||hour>=18;
 useEffect(()=>{gl.shadowMap.enabled=context.world.settings.quality==='standard';setDpr(context.world.settings.quality==='low'?1:Math.min(devicePixelRatio,1.5));invalidate();},[context.world.settings.quality,gl,setDpr,invalidate]);
 useEffect(()=>{gl.setClearColor(night?'#1b2b35':'#dce9e1');scene.background=new Color(night?'#1b2b35':'#dce9e1');invalidate();},[gl,scene,night,invalidate]);
 useEffect(()=>{worldRuntime.capture=()=>{gl.render(scene,camera);const a=document.createElement('a');a.download='LifeCity-'+new Date().toISOString().replaceAll(':','-')+'.png';a.href=gl.domElement.toDataURL('image/png');a.click();};return()=>{worldRuntime.capture=null;};},[gl,scene,camera]);
 const surprise=preview.world.entities.find(e=>e.id===ui.selected&&e.kind==='surprise');
 if(ui.open&&ui.tab==='surprises'&&surprise?.kind==='surprise')return <SurpriseRoom scene={surprise}/>;
 return <>
  <WorldWeather context={context} active={active}/>
  <ambientLight intensity={night?.35:1.2}/><hemisphereLight args={[night?'#7794a3':'#f3f7eb','#5b745e',night?.4:1.1]}/><directionalLight position={[15,25,8]} intensity={night?.35:2} castShadow shadow-mapSize={[1024,1024]} shadow-camera-left={-80} shadow-camera-right={80} shadow-camera-top={80} shadow-camera-bottom={-80} shadow-normalBias={.04}/>
  {!exploring&&<MapCamera width={main.width+yuyi.width+2} depth={depth} perspective={perspective} resetKey={resetKey}/>}
  <PlayController context={context} realm={realm} offset={origin(realm)} active={active&&!ui.replay}/>
  {(['main','yuyi'] as const).map(r=>{const [ox,oz]=origin(r),ctx=preview,entities=ctx.world.entities.filter(e=>e.realm===r&&e.status==='active'),nodes=entities.filter(e=>e.kind==='node'),legacy=r==='main'?ui.replay?.placements??game.placements:ui.replay?.yuyi_placements??game.v6?.yuyi_placements??[],size=context.legacy_sizes[r],pick=(x:number,z:number)=>{if(!active||ui.replay)return;if(r!==realm){onRealm?.(r);return;}ui.set({point:{x,z}});if(exploring&&!ui.open){worldRuntime.target={x,z};invalidate();}if(draft)onTile?.(Math.floor(x),Math.floor(z));};
   return <group key={r} position={[ox,0,oz]}>
    {entities.filter(e=>e.kind==='parcel').map(e=>e.kind==='parcel'&&<ParcelGround key={e.id} parcel={e} context={ctx} pick={pick} ghost={!!ui.ghost?.patch.upsert.some(v=>v.kind==='terrain'&&v.realm===r||v.id===e.id)}/>)}
    {props.gridVisible&&<gridHelper args={[Math.max(size,extents(r).width),Math.max(size,extents(r).width),'#6f8565','#8b9f7c']} position={[size/2,.025,size/2]}/>}
    {legacy.map(p=>{const item=game.catalog.find(v=>v.id===p.catalog_id);if(!item)return null;const [w,d]=footprint(item,p.rotation);return <group key={p.id} position={[p.x+w/2,heightAt(terrainAt(ctx,r),p.x+w/2,p.z+d/2)+.04,p.z+d/2]} onClick={e=>{e.stopPropagation();if(!active||ui.replay)return;if(r!==realm)onRealm?.(r);else if(draft)pick(p.x,p.z);else onSelect?.(p);}}><group rotation={[0,p.rotation*Math.PI/180,0]}><ProceduralModel item={item} ghost={draft?.placementId===p.id} valid/></group>{props.selectedId===p.id&&<Line points={[[-w/2,.02,-d/2],[w/2,.02,-d/2],[w/2,.02,d/2],[-w/2,.02,d/2],[-w/2,.02,-d/2]]} color="#e6c16e" lineWidth={2}/>}</group>;})}
    {r===realm&&draft&&(()=>{const [w,d]=footprint(draft.item,draft.rotation);return <group position={[draft.x+w/2,.06,draft.z+d/2]} rotation={[0,draft.rotation*Math.PI/180,0]}><ProceduralModel item={draft.item} ghost valid={props.valid}/></group>;})()}
    {entities.map(e=>e.kind==='building'?<MeasuredBuilding key={e.id} building={e} context={ctx} ghost={!!ui.ghost?.patch.upsert.some(v=>v.id===e.id)}/>:e.kind==='node'?<NodeMesh key={e.id} node={e} context={ctx}/>:e.kind==='edge'?<NetworkMesh key={e.id} edge={e} nodes={nodes} context={ctx}/>:e.kind==='decoration'?<DecorationMesh key={e.id} id={e.id} context={ctx} realm={r}/>:null)}
    {context.world.entities.filter(e=>e.realm===r&&e.status==='active').map(e=>e.kind==='avatar'?<AvatarActor key={e.id} avatar={e} realm={r}/>:e.kind==='car'?<CarActor key={e.id} car={e} driven={actor?.kind==='avatar'&&actor.vehicle_id===e.id} realm={r}/>:null)}
    <WorldLife context={context} realm={r} active={active}/>
   </group>;
  })}
  <SceneCelebration game={game}/>
 </>;
}
function SceneCelebration({game}:{game:GameSnapshot}){
 const settings=game.world_systems?.settings,celebration=useWorldUI(s=>s.celebration),ref=useRef<import('three').Group>(null),invalidate=useThree(s=>s.invalidate);
 useEffect(()=>{if(celebration)invalidate();},[celebration,invalidate]);
 useFrame((_,delta)=>{if(!ref.current)return;ref.current.visible=!!settings?.celebrations_enabled&&!!celebration;if(ref.current.visible&&!settings?.reduced_motion&&!settings?.photosensitive){ref.current.rotation.y+=delta*.4;invalidate();}});
 if(!celebration||!settings?.celebrations_enabled)return null;
 return <group ref={ref} position={[0,4,0]}>{Array.from({length:settings.photosensitive?4:12},(_,i)=><mesh key={i} position={[Math.sin(i)*2,i%3,Math.cos(i)*2]}><sphereGeometry args={[.08,6,4]}/><meshBasicMaterial color={i%2?'#e1c47c':'#b5cbb4'}/></mesh>)}</group>;
}
