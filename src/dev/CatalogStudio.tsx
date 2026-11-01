import {BUILDING_CATALOG} from '../../supabase/functions/_shared/building-catalog';
import {useLayoutEffect,useMemo,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Canvas,useFrame,useThree} from '@react-three/fiber';
import {Box3,Group,Vector3,OrthographicCamera} from 'three';
import {ASSET_ART,type AssetArt} from '../world/asset-catalog';
import {ProceduralModel} from '../world/ProceduralModel';
import {BotanicalPlant,FarmModel} from '../world/BotanicalAssets';
import {MeasuredBuilding,FurnitureMesh,NodeMesh,DecorationMesh,NetworkMesh} from '../world/WorldGeometry';
import {CarMesh} from '../world/WorldActors';
import {CATALOG} from '../lib/catalog';
import {CARS} from '../../supabase/functions/_shared/world-motion';
import {FURNITURE} from '../../supabase/functions/_shared/world-commerce';
import {NODE_CATALOG,DECORATIONS} from '../../supabase/functions/_shared/world-infrastructure';
import {CROPS,FARM_PLOTS} from '../../supabase/functions/_shared/world-horticulture';
import {generatePlans,defaultRooms,MATERIALS} from '../../supabase/functions/_shared/world-planner';
import {emptyWorld,DEFAULT_WORLD_SETTINGS} from '../../supabase/functions/_shared/world-engine';
import type {Building,WorldContext,Car,Decoration,NetworkNode,Archetype} from '../../supabase/functions/_shared/world-types';
const now='2026-11-01T12:00:00.000Z';
const base={id:'art',name:'',realm:'main' as const,version:1,status:'active' as const,created_at:now};
function context():WorldContext{return {user_id:'catalog-art-only',now,world:{...emptyWorld(),initialized:true,settings:{...DEFAULT_WORLD_SETTINGS,clock:'fixed',hour:12}},balances:{MAIN:'0',YUYI_MAD:'0'},fx:null,legacy:[],legacy_sizes:{main:16,yuyi:16},legacy_versions:{main:0,yuyi:0},eligible_income:'0',income_paid:'0',legitimate_minutes:0,legitimate_actions:0,milestones:[],receipt:null};}
function Subject({asset:a}:{asset:AssetArt}){
 const c=useMemo(context,[]);
 if(a.family==='legacy')return <ProceduralModel item={CATALOG.find(v=>v.id===a.id)!} variation={a.key}/>;
 if(a.family==='vegetation')return <BotanicalPlant species={a.id}/>;
 if(a.family==='building'){
  const profile=BUILDING_CATALOG[a.id as Archetype];const floors=generatePlans({width:profile.width,depth:profile.depth,floors:1,archetype:a.id as Archetype,rooms:defaultRooms(a.id as Archetype),accessible:false,budget:'100000'},{x:0,z:0,width:16,depth:16});
  const b:Building={...base,kind:'building',name:a.en,width:profile.width,depth:profile.depth,x:0,z:0,y:0,rotation:0,style:'forest',archetype:a.id as Archetype,parcel_id:'art',floors,stages:[{id:'floor:0',type:'floor',floor:0,paid:true,component_ids:[]},...(['frame','roof','finish','opening'] as const).map(type=>({id:type,type,floor:null,paid:true,component_ids:[]}))],contractor:'moss',materials:[],tenants:[],staff:0,capacity:0,hotel:null,last_income_at:now,opened_at:now};
  return <MeasuredBuilding building={b} context={c} visualHour={12}/>;
 }
 if(a.family==='furniture'){const f=FURNITURE.find(v=>v.id===a.id)!;return <FurnitureMesh item={{...base,kind:'furniture',type:f.id,width:f.width,depth:f.depth,x:0,z:0,floor:0,building_id:null,room_id:null,rotation:0,material:'wood'}}/>;}
 if(a.family==='car'){const car:Car={...base,kind:'car',model:CARS.find(v=>v.id===a.id)!.id,pose:{x:0,z:0,y:0,heading:0},garage_id:null,slot:null,paint:'#598b75',rims:'standard',tint:0,plate:'CITY',trim:'standard',components:{}};return <CarMesh car={car}/>;}
 if(a.family==='farm'||a.family==='crop'){
  const crop=a.family==='crop'?CROPS.find(v=>v.id===a.id):null,plot=FARM_PLOTS.find(v=>v.id===(crop?.plot??a.id))!;
  const e:Decoration={...base,kind:'decoration',type:'farm_plot',x:0,z:0,width:plot.width,depth:plot.depth,material:'soil',farm:{plot:plot.id,cycle:1,crop:crop?{id:crop.id,planted_at:'2026-10-20T12:00:00Z',waterings:crop.waterings,harvested_at:null}:null,produce:{},harvests:0}};
  return <FarmModel entity={e} now={now}/>;
 }
 if(a.family==='node'){const n=NODE_CATALOG.find(v=>v.id===a.id)!,node:NetworkNode={...base,kind:'node',x:0,z:0,y:0,network:n.network,role:n.role,capacity:n.capacity,demand:0,building_id:null,signal:null,energy:0,last_tick_at:now};return <NodeMesh node={node} context={c} night={false}/>;}
 if(a.family==='decoration'){const d=DECORATIONS.find(v=>v.id===a.id)!,e:Decoration={...base,kind:'decoration',type:d.id,x:0,z:0,width:d.width,depth:d.depth,material:'forest'};c.world.entities=[e];return <DecorationMesh context={c} realm="main" id={e.id}/>;}
 if(a.family==='material'){const m=MATERIALS.find(v=>v.id===a.id)!;return <mesh rotation={[0,.2,0]}><boxGeometry args={[1.3,.22,1.3]}/><meshStandardMaterial color={m.color} roughness={m.roughness} metalness={m.metalness}/></mesh>;}
 if(a.id==='road'){
  const n:NetworkNode={...base,kind:'node',x:0,z:0,y:0,network:'road',role:'junction',capacity:100,demand:0,building_id:null,signal:null,energy:0,last_tick_at:now};const nodes=[{...n,id:'a',x:-2},{...n,id:'b',x:2}];return <NetworkMesh edge={{...base,kind:'edge',network:'road',from:'a',to:'b',directed:false,lanes:1,speed:8,capacity:100,depth:0,blocked:false}} nodes={nodes} context={c}/>;
 }
 return <mesh><boxGeometry args={[3,a.id==='terrain'?.6:.2,3]}/><meshStandardMaterial color="#95b986"/></mesh>;
}
function Framed({asset}:{asset:AssetArt}){
 const root=useRef<Group>(null),{camera,size,gl,invalidate}=useThree(),frames=useRef(0);
 useLayoutEffect(()=>{if(!root.current)return;const box=new Box3().setFromObject(root.current),center=box.getCenter(new Vector3()),extent=Math.max(...box.getSize(new Vector3()).toArray(),1);camera.position.copy(center).add(new Vector3(extent,extent*.85,-extent));camera.lookAt(center);const c=camera as OrthographicCamera;c.zoom=1;c.updateProjectionMatrix();camera.updateMatrixWorld();const points=[];for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z])points.push(new Vector3(x,y,z).project(camera));c.zoom=Math.min(1.68/(Math.max(...points.map(p=>p.x))-Math.min(...points.map(p=>p.x))),1.55/(Math.max(...points.map(p=>p.y))-Math.min(...points.map(p=>p.y))));c.updateProjectionMatrix();frames.current=0;delete gl.domElement.dataset.asset;invalidate();},[asset,camera,size,gl,invalidate]);
 useFrame(()=>{if(++frames.current>=3)gl.domElement.dataset.asset=asset.key;else invalidate();});
 return <group ref={root}><Subject key={asset.key} asset={asset}/></group>;
}
function Studio(){const [key,setKey]=useState(ASSET_ART[0].key),asset=ASSET_ART.find(v=>v.key===key)!;return <><select id="asset-select" value={key} onChange={e=>setKey(e.target.value)}>{ASSET_ART.map(a=><option key={a.key} value={a.key}>{a.key}</option>)}</select><div style={{width:240,height:180}}><Canvas orthographic dpr={1} camera={{position:[8,6,-8],zoom:30,near:.01,far:300}} gl={{alpha:true,antialias:true,preserveDrawingBuffer:true}} frameloop="demand"><ambientLight intensity={1.6}/><hemisphereLight args={['#ffffff','#9db0bf',1.2]}/><directionalLight position={[5,12,-8]} intensity={2.3}/><Framed asset={asset}/></Canvas></div></>;}
createRoot(document.getElementById('root')!).render(<Studio/>);
