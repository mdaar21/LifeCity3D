import {AssetBox} from './StylizedAssets';
import {VISUAL} from './visual-style';
import type {RoadConnections} from './road-visuals';
export function ConnectedRoad({connections=[true,false,true,false],path=false,ghost=false,valid=true}:{connections?:RoadConnections;path?:boolean;ghost?:boolean;valid?:boolean}){
 const count=connections.filter(Boolean).length,links=count?connections:[true,false,true,false],tone=(c:string)=>ghost?(valid?VISUAL.mint:VISUAL.warning):c;
 return <group><AssetBox at={[0,.035,0]} size={[1,.07,1]} color={tone(path?'#d7c9ac':VISUAL.asphalt)} ghost={ghost}/>{links.map((connected,i)=><group key={i} rotation={[0,-i*Math.PI/2,0]}>
  {!connected&&<AssetBox at={[0,.075,-.47]} size={[1,.08,.06]} color={tone(VISUAL.curb)} ghost={ghost}/>}
  {connected&&!path&&<><AssetBox at={[0,.076,-.32]} size={[.035,.008,.17]} color={tone(VISUAL.cream)} ghost={ghost}/>{count>=3&&[-.26,-.13,0,.13,.26].map(x=><AssetBox key={x} at={[x,.079,-.43]} size={[.07,.008,.12]} color={tone(VISUAL.cream)} ghost={ghost}/>)}</>}
 </group>)}</group>;
}
