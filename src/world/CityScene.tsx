import { Component, Suspense, useEffect, useMemo, useRef, useState, type ComponentRef, type ReactNode } from 'react'
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { OrbitControls, OrthographicCamera, PerspectiveCamera } from '@react-three/drei'
import { InstancedMesh, Object3D, PCFSoftShadowMap } from 'three'
import type { CatalogItem, Placement, GameSnapshot } from '../lib/types'
import { CATALOG } from '../lib/catalog'
import { useLocale } from '../lib/locale'
import { footprint, type DraftPlacement } from './building'
import { ProceduralModel, SCENE_BACKGROUND } from './ProceduralModel'
import {CoastalBackdrop} from './CoastalBackdrop'
import {roadConnections} from './road-visuals'
import {WorldRealms} from './WorldRealms'
import '../world.css'

interface SceneProps {
  worldGame?:GameSnapshot
  active?:boolean
  placements?: Placement[]
  catalog?: CatalogItem[]
  size?: number
  className?: string
  selectedId?: string | null
  draft?: DraftPlacement | null
  valid?: boolean
  gridVisible?: boolean
  perspective?: boolean
  resetKey?: number
  interior?: boolean
  onTile?: (x: number, z: number) => void
  onHoverTile?: (x: number, z: number) => void
  onSelect?: (placement: Placement) => void
  readOnly?: boolean
  bare?: boolean
  originX?: number
  neighbor?: {placements:Placement[];size:number}
  realm?: 'main'|'yuyi'
  onRealm?: (realm:'main'|'yuyi')=>void
}

export interface LifeCityRenderMetrics {
  scene: 'city' | 'interior'
  startedAtMs: number
  lastRenderedAtMs: number | null
  renderedFrames: number
  rendererFrame: number
  calls: number
  triangles: number
  dpr: number
  webglVersion: string
  drawingBufferWidth: number
  drawingBufferHeight: number
  /** Last 240 gaps between completed renders; demand-render idle time is included. */
  frameGapsMs: number[]
}

declare global {
  interface Window { __LIFECITY_RENDER_METRICS__?: LifeCityRenderMetrics }
}

/** Samples completed Three renders, without another render loop or React updates. */
function RendererDiagnostics({ interior }: { interior: boolean }) {
  const gl = useThree(state => state.gl)
  const metricsRef = useRef<LifeCityRenderMetrics | null>(null)
  const previousRendererFrame = useRef(gl.info.render.frame)
  useEffect(() => {
    const context = gl.getContext()
    const metrics: LifeCityRenderMetrics = {
      scene: interior ? 'interior' : 'city',
      startedAtMs: performance.now(),
      lastRenderedAtMs: null,
      renderedFrames: 0,
      rendererFrame: gl.info.render.frame,
      calls: 0,
      triangles: 0,
      dpr: gl.getPixelRatio(),
      webglVersion: String(context.getParameter(context.VERSION)),
      drawingBufferWidth: gl.domElement.width,
      drawingBufferHeight: gl.domElement.height,
      frameGapsMs: [],
    }
    previousRendererFrame.current = gl.info.render.frame
    metricsRef.current = metrics
    window.__LIFECITY_RENDER_METRICS__ = metrics
    return () => {
      metricsRef.current = null
      if (window.__LIFECITY_RENDER_METRICS__ === metrics) delete window.__LIFECITY_RENDER_METRICS__
    }
  }, [gl, interior])
  useFrame(() => {
    // Fiber renders synchronously after its useFrame callbacks. Read info in a
    // microtask so these counters describe that finished render, not a RAF tick.
    queueMicrotask(() => {
      const metrics = metricsRef.current
      const frame = gl.info.render.frame
      if (!metrics || frame <= previousRendererFrame.current) return
      const now = performance.now()
      if (metrics.lastRenderedAtMs !== null) {
        if (metrics.frameGapsMs.length >= 240) metrics.frameGapsMs.shift()
        metrics.frameGapsMs.push(now - metrics.lastRenderedAtMs)
      }
      metrics.renderedFrames += frame - previousRendererFrame.current
      gl.domElement.dataset.renderedFrames = String(metrics.renderedFrames)
      previousRendererFrame.current = frame
      metrics.lastRenderedAtMs = now
      metrics.rendererFrame = frame
      metrics.calls = gl.info.render.calls
      metrics.triangles = gl.info.render.triangles
      metrics.dpr = gl.getPixelRatio()
      metrics.drawingBufferWidth = gl.domElement.width
      metrics.drawingBufferHeight = gl.domElement.height
    })
  })
  return null
}

export class CanvasErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}

function WebGLFallback() {
  const { t } = useLocale()
  return <div className="world-fallback" role="status"><span className="world-fallback-symbol">◇</span><strong>{t('العرض ثلاثي الأبعاد غير متاح', '3D view is unavailable')}</strong><p>{t('فعّل تسريع الرسوميات في متصفحك أو جرّب جهازًا يدعم WebGL. تبقى أدوات البناء والمخزون متاحة أدناه.', 'Enable graphics acceleration in your browser or try a WebGL-compatible device. Building controls and inventory remain available below.')}</p></div>
}

function RockShore({ size }: { size: number }) {
  const ref = useRef<InstancedMesh>(null)
  useEffect(() => {
    if (!ref.current) return
    const transform = new Object3D()
    for (let i = 0; i < 36; i++) {
      const angle = i / 36 * Math.PI * 2
      const edge = size * 0.72 + Math.sin(i * 4.7) * 0.8
      transform.position.set(Math.cos(angle) * edge, -0.64, Math.sin(angle) * edge)
      transform.rotation.set(i * 0.2, i * 1.3, 0.2)
      transform.scale.set(0.4 + (i % 3) * 0.18, 0.33, 0.45 + (i % 4) * 0.1)
      transform.updateMatrix()
      ref.current.setMatrixAt(i, transform.matrix)
    }
    ref.current.instanceMatrix.needsUpdate = true
  }, [size])
  return <instancedMesh ref={ref} args={[undefined, undefined, 36]} castShadow receiveShadow><dodecahedronGeometry args={[1, 0]} /><meshStandardMaterial color="#bac1a5" roughness={1} /></instancedMesh>
}

function Landscape({ size }: { size: number }) {
  const treeItem = CATALOG.find(item => item.model === 'tree')
  return <>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.04, 0]} receiveShadow><planeGeometry args={[160, 160]} /><meshStandardMaterial color="#a5d4d6" roughness={0.48} metalness={0.03} /></mesh>
    <mesh position={[0, -0.61, 0]} receiveShadow><cylinderGeometry args={[size * 0.77, size * 0.73, 0.7, 8]} /><meshStandardMaterial color="#d2c6a2" roughness={1} /></mesh>
    <mesh position={[0, -0.29, 0]} receiveShadow><cylinderGeometry args={[size * 0.72, size * 0.77, 0.55, 8]} /><meshStandardMaterial color="#90a87a" roughness={1} /></mesh>
    <mesh position={[0, -0.075, 0]} receiveShadow><boxGeometry args={[size + 0.12, 0.15, size + 0.12]} /><meshStandardMaterial color="#a4b78c" roughness={1} /></mesh>
    <RockShore size={size} />
    {treeItem && Array.from({ length: 9 }, (_, i) => {
      const angle = i / 9 * Math.PI * 2 + 0.16
      // Decorative trees sit outside the square of owned, buildable land.
      const x = Math.cos(angle) * size * 0.65, z = Math.sin(angle) * size * 0.65
      return Math.abs(x) > size / 2 + 0.4 || Math.abs(z) > size / 2 + 0.4 ? <group key={i} position={[x, -0.05, z]} scale={0.8 + i % 3 * 0.18}><ProceduralModel item={treeItem} /></group> : null
    })}
    {[[-23, -20], [27, -15], [-15, 30]].map(([x, z], i) => <mesh key={i} position={[x, -0.87, z]} scale={[4 + i, 0.55, 2 + i]}><sphereGeometry args={[1, 12, 7]} /><meshStandardMaterial color="#a4b894" roughness={1} /></mesh>)}
  </>
}

function CameraRig({ size, perspective, resetKey, interior }: { size: number; perspective: boolean; resetKey: number; interior: boolean }) {
  const target = useMemo(() => [0, 0, 0] as [number, number, number], [])
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null)
  const { camera, size: viewport } = useThree()
  useEffect(() => {
    camera.position.set(size * 1.04, size * 0.95, size * 1.04)
    camera.lookAt(0, 0, 0)
    controls.current?.target.set(0, 0, 0)
    controls.current?.update()
  }, [camera, resetKey, size, perspective])
  const zoom = Math.min(viewport.width, viewport.height) / (size * (interior ? 1.5 : 1.72))
  return <>
    {perspective ? <PerspectiveCamera makeDefault fov={43} position={[size, size, size]} near={0.1} far={220} /> : <OrthographicCamera makeDefault position={[size, size, size]} zoom={zoom} near={0.1} far={220} />}
    <OrbitControls ref={controls} target={target} makeDefault enableDamping dampingFactor={0.12} minPolarAngle={0.2} maxPolarAngle={Math.PI / 2.35} minDistance={size * 0.5} maxDistance={size * 3} minZoom={Math.max(3, zoom * 0.6)} maxZoom={zoom * 3.5} panSpeed={0.65} rotateSpeed={0.55} zoomSpeed={0.8} onChange={() => { if (controls.current) { controls.current.target.x = Math.max(-size * 0.65, Math.min(size * 0.65, controls.current.target.x)); controls.current.target.z = Math.max(-size * 0.65, Math.min(size * 0.65, controls.current.target.z)); controls.current.target.y = 0 } }} />
  </>
}

function PlotContents({placements=[],catalog=CATALOG,size=16,selectedId,draft,valid=true,gridVisible=false,interior=false,onTile,onHoverTile,onSelect,readOnly=false,bare=false,originX=0}:SceneProps){
 const roads=useMemo(()=>roadConnections(placements,catalog),[placements,catalog]);
 const tileEvent=(event:ThreeEvent<PointerEvent|MouseEvent>,hover=false)=>{
  event.stopPropagation();const x=Math.floor(event.point.x-originX+size/2),z=Math.floor(event.point.z+size/2);
  if(x<0||z<0||x>=size||z>=size)return;
  if(hover)onHoverTile?.(x,z);else onTile?.(x,z);
 };
 return <>
    {interior ? <>
      <mesh position={[0, -0.09, 0]} receiveShadow><boxGeometry args={[size, 0.18, size]} /><meshStandardMaterial color="#d8bea0" roughness={0.95} /></mesh>
      <mesh position={[0, 0.9, -size / 2]} receiveShadow><boxGeometry args={[size + 0.18, 1.8, 0.18]} /><meshStandardMaterial color="#ebe4d3" /></mesh>
      <mesh position={[-size / 2, 0.9, 0]} receiveShadow><boxGeometry args={[0.18, 1.8, size]} /><meshStandardMaterial color="#d6ded0" /></mesh>
      <mesh position={[1, 1.08, -size / 2 + 0.102]}><boxGeometry args={[2.2, 1.05, 0.025]} /><meshStandardMaterial color="#a6d7df" emissive="#a6d7df" emissiveIntensity={0.2} /></mesh>
      <mesh position={[1, 1.08, -size / 2 + 0.125]}><boxGeometry args={[0.055, 1.05, 0.025]} /><meshStandardMaterial color="#fff4de" /></mesh>
    </> : bare ? <mesh position={[0,-0.12,0]} receiveShadow><boxGeometry args={[size,.24,size]}/><meshStandardMaterial color="#a4b78c" roughness={1}/></mesh> : <Landscape size={size} />}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]} onClick={readOnly ? undefined : event => tileEvent(event)} onPointerMove={draft && !readOnly ? event => tileEvent(event, true) : undefined} receiveShadow>
      <planeGeometry args={[size, size]} /><meshStandardMaterial color={interior ? '#d9c3a4' : '#a3b88c'} transparent opacity={interior ? 1 : 0.025} depthWrite={false} />
    </mesh>
    {gridVisible && <gridHelper args={[size, size, '#718768', '#8fa47f']} position={[0, 0.022, 0]} />}
    {/* The owned boundary stays visible while individual grid cells are hidden. */}
    {[-1, 1].flatMap(side => [<mesh key={`boundary-x-${side}`} position={[side * size / 2, 0.029, 0]}><boxGeometry args={[0.035, 0.018, size]} /><meshBasicMaterial color="#d9d9b6" /></mesh>, <mesh key={`boundary-z-${side}`} position={[0, 0.029, side * size / 2]}><boxGeometry args={[size, 0.018, 0.035]} /><meshBasicMaterial color="#d9d9b6" /></mesh>])}
    {placements.map(placement => {
      const item = catalog.find(entry => entry.id === placement.catalog_id)
      if (!item) return null
      const [w, d] = footprint(item, placement.rotation)
      return <group key={placement.id} position={[placement.x + w / 2 - size / 2, 0.04, placement.z + d / 2 - size / 2]} onClick={readOnly ? undefined : event => { event.stopPropagation(); if (draft) tileEvent(event); else onSelect?.(placement) }}>
        {selectedId === placement.id && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.007, 0]}><planeGeometry args={[w + 0.12, d + 0.12]} /><meshBasicMaterial color="#f5cd77" transparent opacity={0.72} depthWrite={false} /></mesh>}
        <group rotation={[0, placement.rotation * Math.PI / 180, 0]}><ProceduralModel item={item} variation={placement.id} connections={roads.get(placement.id)} ghost={draft?.placementId === placement.id} valid /></group>
      </group>
    })}
    {draft && (() => {
      const [w, d] = footprint(draft.item, draft.rotation)
      return <group position={[draft.x + w / 2 - size / 2, 0.07, draft.z + d / 2 - size / 2]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[w * 0.99, d * 0.99]} /><meshBasicMaterial color={valid ? '#4eaf78' : '#df7275'} transparent opacity={0.45} depthWrite={false} /></mesh>
        <group rotation={[0, draft.rotation * Math.PI / 180, 0]}><ProceduralModel item={draft.item} ghost valid={valid} /></group>
      </group>
    })()}
 </>;
}
function SceneContents(props:SceneProps){
 const {size=16,perspective=false,resetKey=0,interior=false,neighbor,realm='main',onRealm}=props;
 if(props.worldGame?.world_systems?.initialized)return <><RendererDiagnostics interior={false}/><WorldRealms game={props.worldGame} realm={realm} active={props.active??true} perspective={perspective} resetKey={resetKey} draft={props.draft} selectedId={props.selectedId} valid={props.valid} gridVisible={props.gridVisible} onRealm={onRealm} onSelect={props.onSelect} onTile={props.onTile}/></>;
 const origin=neighbor?(realm==='main'?-size/2-1:size/2+1):0;
 const otherOrigin=neighbor?(realm==='main'?neighbor.size/2+1:-neighbor.size/2-1):0;
 return <>
  <RendererDiagnostics interior={interior}/>
  <primitive object={SCENE_BACKGROUND} attach="background"/>
  <fog attach="fog" args={['#dce9e1',75,180]}/>
  <ambientLight intensity={1.5}/><hemisphereLight args={['#f3f7eb','#6c8876',1.5]}/>
  <directionalLight position={[12,22,8]} intensity={2.5} castShadow shadow-mapSize={[1024,1024]} shadow-camera-left={-45} shadow-camera-right={45} shadow-camera-top={45} shadow-camera-bottom={-45} shadow-bias={-.0008} shadow-normalBias={.04}/>
  <CameraRig size={neighbor?Math.max(size,neighbor.size)*1.85:size} perspective={perspective} resetKey={resetKey} interior={interior}/>
  {neighbor&&<CoastalBackdrop/>}
  <group key={realm} position={[origin,0,0]}><PlotContents {...props} bare={!!neighbor} originX={origin}/></group>
  {neighbor&&<group key={realm==='main'?'yuyi':'main'} position={[otherOrigin,0,0]}><PlotContents placements={neighbor.placements} catalog={props.catalog} size={neighbor.size} bare originX={otherOrigin} readOnly={props.readOnly} onTile={()=>onRealm?.(realm==='main'?'yuyi':'main')} onSelect={()=>onRealm?.(realm==='main'?'yuyi':'main')}/></group>}
 </>;
}

export function WorldCanvas(props: SceneProps) {
  const { t } = useLocale()
  const [supported, setSupported] = useState<boolean | null>(null)
  useEffect(() => {
    try {
      const element = document.createElement('canvas')
      const context = element.getContext('webgl2') || element.getContext('webgl')
      setSupported(Boolean(context))
      context?.getExtension('WEBGL_lose_context')?.loseContext()
    } catch { setSupported(false) }
  }, [])
  return <div className={`world-canvas ${props.className || ''}`} data-testid="city-canvas" role="region" aria-label={props.interior ? t('غرفة ثلاثية الأبعاد قابلة للتأثيث', 'Interactive 3D room') : t('مدينة ثلاثية الأبعاد قابلة للبناء', 'Interactive 3D city')}>
    {supported === null ? <div className="world-loading">{t('نجهّز عالمك…', 'Preparing your world…')}</div> : supported ? <CanvasErrorBoundary fallback={<WebGLFallback />}><Canvas shadows frameloop="demand" dpr={[1, 1.5]} gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }} fallback={<WebGLFallback />} onCreated={({ gl }) => { gl.setClearColor(SCENE_BACKGROUND); gl.shadowMap.type = PCFSoftShadowMap; gl.domElement.addEventListener('webglcontextlost', event => { event.preventDefault(); setSupported(false) }, { once: true }) }}><Suspense fallback={null}><SceneContents {...props} /></Suspense></Canvas></CanvasErrorBoundary> : <WebGLFallback />}
  </div>
}

export function CityPreview({ placements = [], catalog = CATALOG, size = 16, className }: Pick<SceneProps, 'placements' | 'catalog' | 'size' | 'className'>) {
  return <WorldCanvas placements={placements} catalog={catalog} size={size} className={className} readOnly />
}

export function ItemPreview({ item, className }: { item: CatalogItem; className?: string }) {
  const size = Math.max(item.footprint_x, item.footprint_z, item.model === 'skyscraper' ? 4 : 2) + 1
  const preview: Placement = { id: 'preview', inventory_id: 'preview', catalog_id: item.id, x: (size - item.footprint_x) / 2, y: 0, z: (size - item.footprint_z) / 2, rotation: 0, version: 1 }
  return <WorldCanvas placements={[preview]} catalog={[item]} size={size} className={className} interior={item.is_furniture} readOnly />
}
