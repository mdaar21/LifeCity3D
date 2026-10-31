import {AssetBox} from './StylizedAssets';
import {VISUAL} from './visual-style';
/** Standard paid facade finish, kept inside the existing building envelope. */
export function FacadeDetails({width:w,depth:d,floor,archetype,glass}:{width:number;depth:number;floor:number;archetype:string;glass:string}){
 const accent=['school','university'].includes(archetype)?'#719e88':['clinic','hospital'].includes(archetype)?'#72a4a1':['hotel','resort'].includes(archetype)?'#bc9b6a':archetype==='restaurant'?'#b97d65':VISUAL.ocean;
 return <group position={[0,floor*3,0]}><AssetBox at={[w/2,2.83,-.045]} size={[w,.12,.1]} color={accent}/>{[.2,.8].map((ratio,i)=><group key={i} position={[w*ratio,1.5,-.08]}><AssetBox at={[0,0,0]} size={[w*.19,1.25,.08]} color={VISUAL.cream}/><AssetBox at={[0,0,-.05]} size={[w*.19-.12,1.1,.035]} color={glass}/><AssetBox at={[0,0,-.075]} size={[.045,1.1,.025]} color={VISUAL.cream}/><AssetBox at={[0,-.64,-.06]} size={[w*.21,.08,.17]} color={accent}/></group>)}{archetype==='office'&&[.12,.88].map(x=><AssetBox key={x} at={[w*x,1.5,d+.035]} size={[.12,3,.08]} color={accent}/>)}{['clinic','hospital'].includes(archetype)&&floor===0&&<group position={[w*.8,2.15,-.15]}><AssetBox at={[0,0,0]} size={[.13,.5,.055]} color="#4d937e"/><AssetBox at={[0,0,0]} size={[.5,.13,.055]} color="#4d937e"/></group>}</group>;
}
