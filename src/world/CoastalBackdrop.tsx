import {VISUAL} from './visual-style';
/** Technical sea/background only. It creates no purchasable objects or saved assets. */
export function CoastalBackdrop(){return <group><mesh rotation={[-Math.PI/2,0,0]} position={[0,-.32,0]} receiveShadow><planeGeometry args={[220,220]}/><meshStandardMaterial color={VISUAL.water} roughness={.45} metalness={.04}/></mesh>{[-24,-16,17,27].map((z,i)=><mesh key={z} rotation={[-Math.PI/2,0,0]} position={[i%2?35:-35,-.315,z]}><planeGeometry args={[9+i*2,.055]}/><meshBasicMaterial color="#b5dde1" transparent opacity={.42}/></mesh>)}</group>;}
