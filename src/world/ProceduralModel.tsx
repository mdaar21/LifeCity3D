import {BotanicalPlant} from './BotanicalAssets'
import type { ReactNode } from 'react'
import { Color } from 'three'
import {ArchitectureAsset,StylizedPlant} from './StylizedAssets'
import {ConnectedRoad} from './ConnectedRoad'
import type {RoadConnections} from './road-visuals'
import type { CatalogItem } from '../lib/types'

interface ModelProps { item: CatalogItem; ghost?: boolean; valid?: boolean; variation?:string; connections?:RoadConnections; night?:boolean }
const palette = { forest: '#315e49', moss: '#73945c', ivory: '#f6f0d9', gold: '#e1b45c', roof: '#567a72', dark: '#263e3a', glass: '#a6d7df', wood: '#a77850' }

/** Original procedural assets: all dimensions are expressed in owned grid tiles. */
export function ProceduralModel({ item, ghost = false, valid = true, variation=item.id, connections, night=false }: ModelProps) {
  const color = (value: string) => ghost ? (valid ? '#75d9a0' : '#ed7880') : value
  const material = (value: string, extra: object = {}) => <meshStandardMaterial color={color(value)} roughness={0.83} transparent={ghost} opacity={ghost ? 0.58 : 1} {...extra} />
  const box = (position: [number, number, number], scale: [number, number, number], shade: string, key?: string) => <mesh key={key} position={position} castShadow receiveShadow><boxGeometry args={scale} />{material(shade)}</mesh>
  const sphere = (position: [number, number, number], radius: number, shade: string, key?: string) => <mesh key={key} position={position} castShadow><icosahedronGeometry args={[radius, 1]} />{material(shade)}</mesh>
  const tree = (x = 0, z = 0, scale = 1, pink = false) => <group position={[x, 0, z]} scale={scale}>
    <mesh position={[0, 0.45, 0]} castShadow><cylinderGeometry args={[0.06, 0.09, 0.9, 7]} />{material(palette.wood)}</mesh>
    {sphere([0, 1.04, 0], 0.42, pink ? '#d99bb1' : palette.forest)}
    {sphere([0.19, 0.88, 0.03], 0.29, pink ? '#eab5c4' : palette.moss)}
    {sphere([-0.18, 0.86, -0.05], 0.28, pink ? '#e9b9c8' : '#558257')}
  </group>
  const lamp = (x = 0, z = 0) => <group position={[x, 0, z]}>
    <mesh position={[0, 0.55, 0]} castShadow><cylinderGeometry args={[0.027, 0.04, 1.1, 6]} />{material(palette.dark)}</mesh>
    <mesh position={[0,1.14,0]}><boxGeometry args={[.2,.24,.2]}/>{material('#f6db9d',{emissive:night?'#f6db9d':'#000000',emissiveIntensity:night?.8:0})}</mesh>{night&&<mesh rotation={[-Math.PI/2,0,0]} position={[0,.08,0]}><circleGeometry args={[.55,16]}/><meshBasicMaterial color="#f6d59b" transparent opacity={.14} depthWrite={false}/></mesh>}
    {box([0, 1.28, 0], [0.27, 0.05, 0.27], palette.dark)}
    {box([0, 0.035, 0], [0.18, 0.07, 0.18], palette.dark)}
  </group>
  const bench = (x = 0, z = 0) => <group position={[x, 0, z]}>
    {box([0, 0.28, 0], [0.77, 0.085, 0.31], palette.wood)}
    {box([0, 0.49, -0.13], [0.77, 0.29, 0.06], palette.wood)}
    {[-0.27, 0.27].map(v => box([v, 0.14, 0], [0.055, 0.28, 0.24], palette.dark, `leg${v}`))}
  </group>
  const model = item.model.toLowerCase()
  if(model.startsWith('botanical:'))return <BotanicalPlant species={model.slice(10)}/>;
  if(['house','villa','apartment','skyscraper','palace'].includes(model)){const family=model==='house'?'home':model==='skyscraper'?'tower':model as 'villa'|'apartment'|'palace';return <ArchitectureAsset family={family} width={Math.max(.7,item.footprint_x*.8)} depth={Math.max(.7,item.footprint_z*.78)} height={model==='skyscraper'?5.4:model==='palace'?2.35:model==='apartment'?2.65:model==='villa'?1.65:1.2} ghost={ghost} valid={valid} night={night}/>;}
  if(model==='tree')return <StylizedPlant seed={variation} ghost={ghost} valid={valid}/>;
  if(model.includes('road')||model.includes('path'))return <ConnectedRoad connections={connections} path={model.includes('path')} ghost={ghost} valid={valid}/>;
  let content: ReactNode
  if (model.includes('road') || model.includes('path')) {
    content = <>{box([0, 0.035, 0], [0.98, 0.07, 0.98], model.includes('path') ? '#d4c3a3' : '#61716d')}{[-0.35, 0, 0.35].map(z => box([0, 0.075, z], [0.035, 0.006, 0.16], '#f4e8b7', `line${z}`))}{[-0.45, 0.45].map(x => box([x, 0.065, 0], [0.055, 0.065, 0.98], '#a9b3a7', `curb${x}`))}</>
  } else if (model.includes('bush')) {
    content = <>{sphere([0, 0.3, 0], 0.31, palette.moss)}{sphere([-0.2, 0.24, 0.1], 0.22, palette.forest)}{sphere([0.21, 0.23, -0.03], 0.22, '#72945d')}</>
  } else if (model.includes('tree') || model.includes('rose')) {
    content = tree(0, 0, 1, model.includes('rose'))
  } else if (model.includes('car')) {
    content = <>{box([0, 0.22, 0], [0.64, 0.25, 0.9], '#d2aa66')}{box([0, 0.47, -0.07], [0.54, 0.29, 0.48], '#c0e2df')}{box([0, 0.63, -0.07], [0.58, 0.06, 0.52], '#e2bf7b')}{[-0.34, 0.34].flatMap(x => [-0.29, 0.29].map(z => <mesh key={`${x}${z}`} position={[x, 0.16, z]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.15, 0.15, 0.09, 12]} />{material(palette.dark)}</mesh>))}{[-0.2, 0.2].map(x => box([x, 0.27, 0.46], [0.13, 0.08, 0.025], '#fff5d0', `light${x}`))}</>
  } else if (model.includes('lake') || model.includes('beach') || model.includes('water')) {
    const w = item.footprint_x * 0.98, d = item.footprint_z * 0.98
    content = <>{box([0, 0.025, 0], [w, 0.05, d], model.includes('beach') ? '#e3d2aa' : '#a3ae83')}{box([0, 0.064, 0], [w * 0.83, 0.025, d * 0.8], '#81c8d0')}{Array.from({ length: 5 }, (_, i) => box([((i * 0.33) % 0.8 - 0.4) * w, 0.082, ((i * 0.23) % 0.7 - 0.35) * d], [0.3, 0.009, 0.025], '#c9ece9', `ripple${i}`))}{model.includes('beach') && tree(w * 0.34, -d * 0.32, 0.75)}</>
  } else if (model.includes('bridge')) {
    content = <>{box([0, 0.23, 0], [0.85, 0.16, item.footprint_z * 0.98], palette.wood)}{[-0.43, 0.43].map(x => <group key={x}>{box([x, 0.63, 0], [0.055, 0.065, item.footprint_z * 0.98], palette.ivory)}{[-0.7, 0, 0.7].map(z => box([x, 0.43, z], [0.07, 0.53, 0.07], palette.ivory, `${x}${z}`))}</group>)}</>
  } else if (model.includes('fence')) {
    content = <>{[-0.43, 0, 0.43].map(x => box([x, 0.35, 0], [0.07, 0.7, 0.08], palette.ivory, `post${x}`))}{[0.22, 0.51].map(y => box([0, y, 0], [0.98, 0.055, 0.06], palette.ivory, `rail${y}`))}</>
  } else if (model.includes('bench')) {
    content = bench()
  } else if (model.includes('lamp') || model.includes('light')) {
    content = lamp()
  } else if (model.includes('park') || model.includes('garden') || model.includes('plaza')) {
    const w = item.footprint_x, d = item.footprint_z
    content = <>{box([0, 0.035, 0], [w * 0.96, 0.07, d * 0.96], '#89a871')}{box([0, 0.079, 0], [w * 0.95, 0.025, 0.38], '#d2c6aa')}<group position={[-w*.28,0,-d*.25]} scale={.65}><StylizedPlant kind="palm" seed={variation} ghost={ghost} valid={valid}/></group><group position={[w*.28,0,d*.25]} scale={.7}><StylizedPlant kind={model.includes('garden')?'flowering':'shade'} seed={variation+'park'} ghost={ghost} valid={valid}/></group><group position={[0, 0, d * 0.29]}>{bench()}</group>{lamp(w * 0.3, -d * 0.3)}</>
  } else if (model.includes('sofa')) {
    content = <>{box([0, 0.25, 0], [1.72, 0.37, 0.75], '#cd9c86')}{box([0, 0.52, -0.27], [1.72, 0.45, 0.2], '#c3917d')}{[-0.78, 0.78].map(x => box([x, 0.43, 0.02], [0.19, 0.36, 0.78], '#bd8977', `arm${x}`))}{[-0.4, 0.4].map(x => box([x, 0.46, 0.06], [0.63, 0.11, 0.5], '#e2b8a0', `cushion${x}`))}</>
  } else if (model.includes('bed')) {
    content = <>{box([0, 0.22, 0], [0.85, 0.35, 1.85], palette.wood)}{box([0, 0.46, 0], [0.81, 0.21, 1.78], '#eee7d6')}{box([0, 0.63, -0.91], [0.89, 0.93, 0.09], palette.roof)}{box([0, 0.58, 0.3], [0.83, 0.06, 1.12], '#8ea599')}{[-0.21, 0.21].map(x => box([x, 0.6, -0.57], [0.32, 0.12, 0.4], '#fff8e5', `pillow${x}`))}</>
  } else if (model.includes('rug')) {
    content = <>{box([0, 0.025, 0], [1.86, 0.035, 1.86], '#c39177')}{box([0, 0.047, 0], [1.6, 0.005, 1.6], '#e8cba2')}{box([0, 0.052, 0], [1.35, 0.005, 1.35], '#719484')}</>
  } else if (model.includes('plant')) {
    content = <><mesh position={[0, 0.22, 0]} castShadow><cylinderGeometry args={[0.22, 0.15, 0.4, 10]} />{material('#d5ad8a')}</mesh>{tree(0, 0, 0.64)}</>
  } else if (model.includes('shelf')) {
    content = <>{[-0.43, 0.43].map(x => box([x, 0.7, 0], [0.065, 1.4, 0.4], palette.wood, `side${x}`))}{[0.08, 0.5, 0.94, 1.38].map(y => box([0, y, 0], [0.92, 0.06, 0.43], palette.wood, `board${y}`))}{Array.from({ length: 7 }, (_, i) => box([-0.28 + (i % 4) * 0.17, i < 4 ? 0.25 : 0.7, 0], [0.11, 0.28, 0.23], [palette.roof, palette.gold, '#c48c76'][i % 3], `book${i}`))}</>
  } else if (model.includes('desk') || model.includes('table')) {
    content = <>{box([0, 0.69, 0], [0.9, 0.1, 0.7], palette.wood)}{[-0.35, 0.35].flatMap(x => [-0.28, 0.28].map(z => box([x, 0.33, z], [0.08, 0.66, 0.08], palette.dark, `${x}${z}`)))}{box([0, 0.77, 0], [0.42, 0.035, 0.3], '#f5efd9')}{box([0.3, 0.84, 0], [0.12, 0.2, 0.12], palette.gold)}</>
  } else {
    const palace = model.includes('palace'), tower = model.includes('tower') || model.includes('skyscraper'), apartment = model.includes('apartment'), villa = model.includes('villa')
    const w = Math.max(0.7, item.footprint_x * 0.8), d = Math.max(0.7, item.footprint_z * 0.78)
    const h = tower ? 5.4 : palace ? 2.35 : apartment ? 2.65 : villa ? 1.65 : 1.2
    const body = tower ? '#afc9c5' : palace ? '#eee1c2' : palette.ivory
    content = <>{box([0, 0.075, 0], [w + 0.2, 0.15, d + 0.2], '#d9d2bb')}{box([0, h / 2 + 0.15, 0], [w, h, d], body)}
      {tower ? <>{box([0, h + 0.24, 0], [w * 0.78, 0.28, d * 0.78], palette.roof)}{box([0, h + 0.9, 0], [0.045, 1.1, 0.045], palette.dark)}{Array.from({ length: 10 }, (_, i) => box([0, 0.55 + i * 0.48, d / 2 + 0.008], [w * 0.9, 0.24, 0.02], '#7eaaa9', `floor${i}`))}</> : <mesh position={[0, h + 0.42, 0]} rotation={[0, Math.PI / 4, 0]} castShadow><coneGeometry args={[Math.max(w, d) * 0.78, palace ? 0.65 : 0.85, 4]} />{material(palace ? palette.gold : palette.roof)}</mesh>}
      {box([0, 0.52, d / 2 + 0.016], [Math.min(0.4, w * 0.24), 0.73, 0.05], palette.wood)}
      {Array.from({ length: apartment ? 3 : 1 }, (_, row) => [-1, 1].map(side => box([side * w * 0.3, 0.8 + row * 0.72, d / 2 + 0.02], [w * 0.19, 0.38, 0.045], palette.glass, `window${row}${side}`)))}
      {[-1, 1].map(side => box([side * (w / 2 + 0.012), Math.min(1, h * 0.6), 0], [0.035, 0.39, d * 0.35], palette.glass, `sidewindow${side}`))}
      {(villa || palace) && <>{box([w * 0.28, 0.14, d * 0.48], [w * 0.4, 0.09, d * 0.2], '#8bc8d0')}{tree(-w * 0.43, d * 0.43, 0.65)}</>}
      {palace && [-1, 1].map(side => <group key={side} position={[side * w * 0.39, 0, -d * 0.3]}>{box([0, 1.55, 0], [w * 0.27, 2.8, d * 0.4], '#e4d8b9')}<mesh position={[0, 3.2, 0]} castShadow><coneGeometry args={[w * 0.25, 0.75, 8]} />{material(palette.gold)}</mesh></group>)}
    </>
  }
  return <group>{content}</group>
}

// Reuse one calm background color for all scenes and previews.
export const SCENE_BACKGROUND = new Color('#c7e1e4')
