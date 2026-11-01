import {TouchWorld} from './TouchWorld';
import {useTouchTools} from './useTouchTools';
import {TOUCH} from 'three';
import {useGardenTime} from './BotanicalAssets';
import {useReducedMotion} from 'framer-motion';
import {useShallow} from 'zustand/react/shallow';
import {useEffect,useMemo,useRef,type ComponentRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {OrbitControls,OrthographicCamera,PerspectiveCamera,Line} from '@react-three/drei';
import {useGraphicsProfile} from './useGraphics';
import {WorldAtmosphere,useVisualHour} from './WorldAtmosphere';
import type {GameSnapshot,Placement} from '../lib/types';
import {viewWorldContext} from '../lib/world-state';
import {bounds,heightAt,terrainAt} from '../../supabase/functions/_shared/world-math';
import {CoastalBackdrop} from './CoastalBackdrop';
import {roadConnections} from './road-visuals';
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
function MapCamera({width,depth,perspective,resetKey,focus}:{width:number;depth:number;perspective:boolean;resetKey:number;focus?:[number,number,number,number]}){
 const designOpen=useTouchTools(s=>s.designOpen),editing=useTouchTools(s=>!!s.draft),extraReset=useTouchTools(s=>s.reset);
 const controls=useRef<ComponentRef<typeof OrbitControls>>(null),{camera,size}=useThree();const [cx,cy,cz,inspectSize]=focus??[0,0,0,0];const extent=inspectSize||Math.max(width,depth),zoom=Math.min(size.width,size.height)/(extent*1.45);
 useEffect(()=>{camera.position.set(cx+extent,cy+extent*.95,cz-extent);camera.lookAt(cx,cy,cz);if('zoom' in camera){camera.zoom=perspective?1:zoom;camera.updateProjectionMatrix();}controls.current?.target.set(cx,cy,cz);controls.current?.update();},[camera,extent,resetKey,extraReset,perspective,cx,cy,cz,zoom]);
 useEffect(()=>{if(designOpen&&'setViewOffset' in camera&&typeof camera.setViewOffset==='function')camera.setViewOffset(size.width,size.height,0,size.height*.14,size.width,size.height);else if('clearViewOffset' in camera&&typeof camera.clearViewOffset==='function')camera.clearViewOffset();},[camera,designOpen,size.width,size.height]);
 return <>{perspective?<PerspectiveCamera makeDefault fov={43} near={.08} far={500}/>:<OrthographicCamera makeDefault zoom={zoom} near={.08} far={500}/>}<OrbitControls ref={controls} makeDefault enableDamping enableRotate={!editing} enablePan={!editing} touches={{ONE:TOUCH.ROTATE,TWO:TOUCH.DOLLY_PAN}} minPolarAngle={.15} maxPolarAngle={Math.PI/2.12} minDistance={3} maxDistance={extent*3} minZoom={Math.max(1,zoom*.3)} maxZoom={zoom*8}/></>;
}
export function WorldRealms(props:Props){
 const touch=useTouchTools(useShallow(s=>({preview:s.preview,finishPreview:s.finishPreview,advanced:s.advanced})));
 const {game,realm,active,perspective,resetKey,draft,onRealm,onSelect,onTile}=props,ui=useWorldUI(useShallow(s=>({ghost:s.ghost,replay:s.replay,open:s.open,tab:s.tab,selected:s.selected,floor:s.floor,inspectFocus:s.inspectFocus,overlay:s.overlay,set:s.set}))),{gl,scene,camera,invalidate}=useThree();
 const context=useMemo(()=>{const c=viewWorldContext(game);if(ui.replay)c.world={...c.world,entities:ui.replay.entities};c.world={...c.world,metrics:[metrics(c,'main'),metrics(c,'yuyi')]};return c;},[game,ui.replay]);
 const preview=useMemo(()=>{const quote=ui.ghost??touch.finishPreview??touch.preview;if(!quote)return context;const c={...context,world:previewTransition(context,{expected_revision:context.world.revision,legacy_versions:context.legacy_versions,patch:quote.patch,quote:null,used_quote_id:null,result:quote.patch.result,refunds:quote.refunds})};c.world.metrics=[metrics(c,'main'),metrics(c,'yuyi')];return c;},[context,ui.ghost,touch.preview,touch.finishPreview]);
 const roads=useMemo(()=>({main:roadConnections(ui.replay?.placements??game.placements,game.catalog),yuyi:roadConnections(ui.replay?.yuyi_placements??game.v6?.yuyi_placements??[],game.catalog)}),[game.placements,game.v6?.yuyi_placements,game.catalog,ui.replay]);
 const extents=(r:Realm)=>{const plots=preview.world.entities.filter(e=>e.kind==='parcel'&&e.realm===r&&e.status==='active').map(e=>e.kind==='parcel'?bounds(e.polygon):{x:0,z:0,width:0,depth:0});return {width:Math.max(context.legacy_sizes[r],...plots.map(v=>v.x+v.width)),depth:Math.max(context.legacy_sizes[r],...plots.map(v=>v.z+v.depth))};};
 const main=extents('main'),yuyi=extents('yuyi'),depth=Math.max(main.depth,yuyi.depth),origin=(r:Realm):[number,number]=>[r==='main'?-main.width-1:1,-depth/2],actor=context.world.entities.find(e=>e.kind==='avatar'&&e.realm===realm&&e.status==='active'),exploring=active&&actor?.kind==='avatar'&&actor.mode!=='aerial';
 const selectedBuilding=context.world.entities.find(e=>e.id===ui.selected&&e.kind==='building');const focus:[number,number,number,number]|undefined=ui.inspectFocus&&selectedBuilding?.kind==='building'&&selectedBuilding.realm===realm?[origin(selectedBuilding.realm)[0]+selectedBuilding.x+(selectedBuilding.rotation===90?selectedBuilding.depth:selectedBuilding.width)/2,selectedBuilding.y+(ui.floor??0)*3,origin(selectedBuilding.realm)[1]+selectedBuilding.z+(selectedBuilding.rotation===90?selectedBuilding.width:selectedBuilding.depth)/2,Math.max(selectedBuilding.width,selectedBuilding.depth)*1.2]:undefined;
 const gardenNow=useGardenTime(context.now,active&&context.world.entities.some(e=>e.kind==='decoration'&&!!e.farm?.crop&&!e.farm.crop.harvested_at));
 const graphics=useGraphicsProfile(context.world.settings.quality),hour=useVisualHour(context,active),night=hour<6||hour>=19;
 useEffect(()=>{worldRuntime.capture=()=>{gl.render(scene,camera);const a=document.createElement('a');a.download='LifeCity-'+new Date().toISOString().replaceAll(':','-')+'.png';a.href=gl.domElement.toDataURL('image/png');a.click();};return()=>{worldRuntime.capture=null;};},[gl,scene,camera]);
 const surprise=preview.world.entities.find(e=>e.id===ui.selected&&e.kind==='surprise');
 if(ui.open&&ui.tab==='surprises'&&surprise?.kind==='surprise')return <SurpriseRoom scene={surprise}/>;
 return <>
  {!(ui.floor!==null&&ui.floor<0||['water','sewage','metro'].includes(ui.overlay))&&<CoastalBackdrop hour={hour} weather={context.world.settings.weather}/>}
  <WorldWeather context={context} active={active} profile={graphics} hour={hour}/>
  <WorldAtmosphere hour={hour} weather={context.world.settings.weather} profile={graphics}/>
  {!exploring&&<MapCamera width={main.width+yuyi.width+2} depth={depth} perspective={perspective} resetKey={resetKey} focus={focus??(!touch.advanced?[origin(realm)[0]+extents(realm).width/2,0,origin(realm)[1]+extents(realm).depth/2,Math.max(extents(realm).width,extents(realm).depth)]:undefined)}/>}
  <TouchWorld game={game} realm={realm} offset={origin(realm)} active={active&&!ui.replay} exploring={!!exploring}/>
  <PlayController context={context} realm={realm} offset={origin(realm)} active={active&&!ui.replay}/>
  {(['main','yuyi'] as const).map(r=>{const [ox,oz]=origin(r),ctx=preview,entities=ctx.world.entities.filter(e=>e.realm===r&&e.status==='active'),nodes=entities.filter(e=>e.kind==='node'),legacy=r==='main'?ui.replay?.placements??game.placements:ui.replay?.yuyi_placements??game.v6?.yuyi_placements??[],size=context.legacy_sizes[r],pick=(x:number,z:number)=>{if(!active||ui.replay)return;if(r!==realm){onRealm?.(r);return;}ui.set({point:{x,z}});if(exploring&&!ui.open){worldRuntime.target={x,z};invalidate();}if(draft)onTile?.(Math.floor(x),Math.floor(z));};
   return <group key={r} position={[ox,0,oz]}>
    {entities.filter(e=>e.kind==='parcel').map(e=>e.kind==='parcel'&&<ParcelGround key={e.id} parcel={e} context={ctx} pick={pick} ghost={!!ui.ghost?.patch.upsert.some(v=>v.kind==='terrain'&&v.realm===r||v.id===e.id)}/>)}
    {props.gridVisible&&<gridHelper args={[Math.max(size,extents(r).width),Math.max(size,extents(r).width),'#6f8565','#8b9f7c']} position={[size/2,.025,size/2]}/>}
    {legacy.map(p=>{const item=game.catalog.find(v=>v.id===p.catalog_id);if(!item)return null;const [w,d]=footprint(item,p.rotation);return <group key={p.id} userData={{touchTarget:{source:'legacy',id:p.id,realm:r}}} position={[p.x+w/2,heightAt(terrainAt(ctx,r),p.x+w/2,p.z+d/2)+.04,p.z+d/2]} onClick={e=>{e.stopPropagation();if(!active||ui.replay)return;if(r!==realm)onRealm?.(r);else if(draft)pick(p.x,p.z);else onSelect?.(p);}}><group rotation={[0,p.rotation*Math.PI/180,0]}><ProceduralModel item={item} variation={p.id} night={night&&!context.world.settings.infrastructure} connections={roads[r].get(p.id)} ghost={draft?.placementId===p.id} valid/></group>{props.selectedId===p.id&&<Line points={[[-w/2,.02,-d/2],[w/2,.02,-d/2],[w/2,.02,d/2],[-w/2,.02,d/2],[-w/2,.02,-d/2]]} color="#e6c16e" lineWidth={2}/>}</group>;})}
    {r===realm&&draft&&(()=>{const [w,d]=footprint(draft.item,draft.rotation);return <group position={[draft.x+w/2,.06,draft.z+d/2]} rotation={[0,draft.rotation*Math.PI/180,0]}><ProceduralModel item={draft.item} ghost valid={props.valid}/></group>;})()}
    {entities.map(e=><group key={e.id} userData={{touchTarget:{source:'world',id:e.id,realm:r}}}>{e.kind==='building'?<MeasuredBuilding key={e.id} building={e} context={ctx} visualHour={hour} ghost={(ui.ghost??touch.finishPreview??touch.preview)?.action!=='material_apply'&&!!(ui.ghost??touch.finishPreview??touch.preview)?.patch.upsert.some(v=>v.id===e.id)}/>:e.kind==='node'?<NodeMesh key={e.id} node={e} context={ctx} night={night}/>:e.kind==='edge'?<NetworkMesh key={e.id} edge={e} nodes={nodes} context={ctx}/>:e.kind==='decoration'?<DecorationMesh key={e.id} id={e.id} context={ctx} realm={r} night={night} now={gardenNow}/>:null}</group>)}
    {context.world.entities.filter(e=>e.realm===r&&e.status==='active').map(e=>e.kind==='avatar'?<group key={e.id} userData={{touchTarget:{source:'world',id:e.id,realm:r}}}><AvatarActor avatar={e} realm={r}/></group>:e.kind==='car'?<group key={e.id} userData={{touchTarget:{source:'world',id:e.id,realm:r}}}><CarActor car={e} driven={actor?.kind==='avatar'&&actor.vehicle_id===e.id} realm={r}/></group>:null)}
    <WorldLife context={context} realm={r} active={active}/>
   </group>;
  })}
  <SceneCelebration game={game} active={active}/>
 </>;
}
function SceneCelebration({game,active}:{game:GameSnapshot;active:boolean}){
 const osReduced=useReducedMotion(),settings=game.world_systems?.settings,celebration=useWorldUI(s=>s.celebration),ref=useRef<import('three').Group>(null),invalidate=useThree(s=>s.invalidate);
 useEffect(()=>{if(celebration)invalidate();},[celebration,invalidate]);
 useFrame((_,delta)=>{if(!ref.current)return;ref.current.visible=!!settings?.celebrations_enabled&&!!celebration&&active;if(ref.current.visible&&!osReduced&&!settings?.reduced_motion&&!settings?.photosensitive&&!document.hidden){ref.current.rotation.y+=delta*.4;invalidate();}});
 if(!celebration||!settings?.celebrations_enabled)return null;
 return <group ref={ref} position={[0,4,0]}>{Array.from({length:settings.photosensitive?4:12},(_,i)=><mesh key={i} position={[Math.sin(i)*2,i%3,Math.cos(i)*2]}><sphereGeometry args={[.08,6,4]}/><meshBasicMaterial color={i%2?'#e1c47c':'#b5cbb4'}/></mesh>)}</group>;
}
