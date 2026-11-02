/** Development-only, isolated art fixture. Never imported by the production app. */
import {useMemo,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Canvas,useFrame,useThree} from '@react-three/fiber';
import {OrbitControls} from '@react-three/drei';
import {Group,PCFSoftShadowMap} from 'three';
import {graphicsProfile,type GraphicsLevel} from '../world/graphics-profile';
import {RenderQuality} from '../world/RenderQuality';
import {RenderEffects} from '../world/RenderEffects';
import {WorldAtmosphere} from '../world/WorldAtmosphere';
import {CoastalBackdrop} from '../world/CoastalBackdrop';
import {SurfaceMaterial} from '../world/SurfaceMaterial';
import {MeasuredBuilding} from '../world/WorldGeometry';
import {BotanicalPlant} from '../world/BotanicalAssets';
import {ConnectedRoad} from '../world/ConnectedRoad';
import {HumanFigure} from '../world/HumanFigure';
import {CarMesh} from '../world/WorldActors';
import {BUILDING_CATALOG} from '../../supabase/functions/_shared/building-catalog';
import {DEFAULT_APPEARANCE} from '../../supabase/functions/_shared/world-motion';
import {generatePlans,defaultRooms} from '../../supabase/functions/_shared/world-planner';
import {emptyWorld,DEFAULT_WORLD_SETTINGS} from '../../supabase/functions/_shared/world-engine';
import type {Archetype,Building,Car,WorldContext} from '../../supabase/functions/_shared/world-types';
const now='2026-11-02T12:00:00Z',base={id:'graphics-art-fixture',name:'Art fixture',realm:'main' as const,version:1,status:'active' as const,created_at:now};
const context:WorldContext={user_id:'isolated-art-fixture',now,world:{...emptyWorld(),initialized:true,settings:{...DEFAULT_WORLD_SETTINGS,clock:'fixed',hour:12}},balances:{MAIN:'0',YUYI_MAD:'0'},fx:null,legacy:[],legacy_sizes:{main:32,yuyi:16},legacy_versions:{main:0,yuyi:0},eligible_income:'0',income_paid:'0',legitimate_minutes:0,legitimate_actions:0,milestones:[],receipt:null};
function building(archetype:Archetype,style:Building['style']='forest'):Building{
 const item=BUILDING_CATALOG[archetype],floors=generatePlans({width:item.width,depth:item.depth,style,floors:archetype.startsWith('tower_')?38:archetype==='office'?3:1,archetype,rooms:defaultRooms(archetype),accessible:false,budget:'1000000000'},{x:0,z:0,width:32,depth:32});
 return {...base,kind:'building',archetype,width:item.width,depth:item.depth,x:0,y:0,z:0,rotation:0,style,parcel_id:'art',floors,stages:[...floors.map(f=>({id:'floor:'+f.index,type:'floor' as const,floor:f.index,paid:true,component_ids:[]})),...(['frame','roof','finish','opening'] as const).map(type=>({id:type,type,floor:null,paid:true,component_ids:[]}))],contractor:'moss',materials:[],tenants:[],staff:0,capacity:0,hotel:null,last_income_at:now,opened_at:now};
}
const car:Car={...base,kind:'car',model:'cedar',pose:{x:0,y:0,z:0,heading:0},garage_id:null,slot:null,paint:'#507f79',rims:'sport',tint:0,plate:'ART',trim:'standard',components:{}};
function Scene({level,hour,weather,moving,tower}:{level:GraphicsLevel;hour:number;weather:string;moving:boolean;tower:boolean}){
 const p=graphicsProfile(level),{gl,invalidate}=useThree(),person=useRef<Group>(null),subjects=useMemo(()=>({house:building('house'),villa:building('villa','coastal'),office:building('office','coastal'),tower:building('tower_twist')}),[]);
 useFrame(()=>{queueMicrotask(()=>{gl.domElement.dataset.quality=level;gl.domElement.dataset.calls=String(gl.info.render.calls);gl.domElement.dataset.triangles=String(gl.info.render.triangles);});});
 useFrame((_,delta)=>{if(moving&&person.current){person.current.rotation.y+=Math.min(delta,.1)*.2;invalidate();}});
 return <RenderQuality.Provider value={p}><WorldAtmosphere hour={hour} weather={weather} profile={p} center={[0,0,0]} span={40}/><CoastalBackdrop hour={hour} weather={weather} active={moving}/><RenderEffects/><OrbitControls makeDefault target={tower?[0,65,0]:[0,1.4,-1]} minDistance={3} maxDistance={350}/>
 <mesh position={[0,-.12,0]} receiveShadow><boxGeometry args={[42,.24,38]}/><SurfaceMaterial surface="grass" color="#94ad7e" roughness={1}/></mesh>
 {tower?<group position={[-6,0,-6]}><MeasuredBuilding building={subjects.tower} context={context} visualHour={hour}/></group>:<>{([['house',-18,-15],['villa',4,-15],['office',-5,6]] as const).map(([id,x,z])=><group key={id} position={[x,0,z]}><MeasuredBuilding building={subjects[id]} context={context} visualHour={hour}/></group>)}{Array.from({length:34},(_,i)=><group key={i} position={[-17+i,0,0]}><ConnectedRoad/></group>)}{[-1,1].flatMap(s=>[0,1,2,3].map(i=><group key={s+':'+i} position={[s*18,0,-12+i*7]}><BotanicalPlant species={i%2?'olive_tree':'date_palm'}/></group>))}<group position={[4,0,0]} rotation={[0,Math.PI/2,0]}><CarMesh car={car}/></group></>}
 <group ref={person} position={[0,0,-3]}><HumanFigure appearance={{...DEFAULT_APPEARANCE,accessory:'backpack'}} moving={moving}/></group>
 </RenderQuality.Provider>;
}
function Studio(){
 const [level,setLevel]=useState<GraphicsLevel>('medium'),[hour,setHour]=useState(12),[weather,setWeather]=useState('clear'),[moving,setMoving]=useState(false),[tower,setTower]=useState(false);
 return <><header style={{position:'absolute',zIndex:10,background:'#122c38',color:'white',padding:10,fontFamily:'sans-serif'}}>Isolated art fixture · no account or save writes <select id="quality" value={level} onChange={e=>setLevel(e.target.value as GraphicsLevel)}>{['low','medium','high','ultra'].map(p=><option key={p}>{p}</option>)}</select><select id="hour" value={hour} onChange={e=>setHour(Number(e.target.value))}>{[12,17,22].map(h=><option key={h}>{h}</option>)}</select><select id="weather" value={weather} onChange={e=>setWeather(e.target.value)}>{['clear','rain','fog'].map(w=><option key={w}>{w}</option>)}</select><button id="motion" onClick={()=>setMoving(x=>!x)}>Motion {moving?'on':'off'}</button><button id="tower" onClick={()=>setTower(x=>!x)}>Tower</button></header><div style={{position:'fixed',inset:0}}><Canvas key={tower?'tower':'city'} shadows={graphicsProfile(level).shadows} dpr={Math.min(graphicsProfile(level).dpr,1.5)} camera={{position:tower?[150,120,-190]:[29,23,-36],fov:43,near:.08,far:2500}} frameloop="demand" gl={{antialias:true,preserveDrawingBuffer:true}} onCreated={({gl})=>{gl.shadowMap.type=PCFSoftShadowMap;}}><Scene level={level} hour={hour} weather={weather} moving={moving} tower={tower}/></Canvas></div></>;
}
createRoot(document.getElementById('root')!).render(<Studio/>);
