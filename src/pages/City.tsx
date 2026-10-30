import { useEffect, useRef, useState } from 'react'
import { Link,useSearchParams } from 'react-router-dom'
import { ArrowDown, List, Share2, ArrowLeft, ArrowRight, ArrowUp, Check, Grid2X2, Home, Maximize2, Move, Package, Plus, Redo2, RotateCw, Trash2, Undo2, X } from 'lucide-react'
import { useGame } from '../lib/game'
import { useLocale } from '../lib/locale'
import { CATALOG } from '../lib/catalog'
import { levelFromXp } from '../lib/rules'
import type { Placement } from '../lib/types'
import { WorldCanvas } from '../world/CityScene'
import { footprint, isHouse, placementIssue } from '../world/building'
import { useBuilder } from '../world/useBuilder'
import { worldError } from '../world/messages'
import FirstCityGuide from '../components/FirstCityGuide'
import CitySharing from '../components/CitySharing'
import '../world.css'

export default function City({active=true}:{active?:boolean}) {
  const { state, loading, error, mutate, refresh, online } = useGame()
  const { t, number } = useLocale()
  const [params]=useSearchParams()
  const guided=useRef(false)
  const { draft, past, future, begin, edit, undo, redo, clear } = useBuilder()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [panel, setPanel] = useState<'inventory'|'objects'|'share'|null>(()=>params.get('panel')==='inventory'?'inventory':null)
  const [grid, setGrid] = useState(false)
  const [perspective, setPerspective] = useState(false)
  const [resetKey, setResetKey] = useState(0)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [success, setSuccess] = useState(false)
  const [expanding, setExpanding] = useState(false)
  useEffect(() => () => {clear();guided.current=false}, [clear])
  useEffect(()=>{if(active&&params.get('panel')==='inventory')setPanel('inventory')},[active,params])
  useEffect(()=>{
    if(guided.current||params.get('guide')!=='tree'||!state)return
    const item=state.catalog.find(v=>v.id==='tree')
    const inventory=state.inventory.find(v=>v.catalog_id==='tree'&&!state.placements.some(p=>p.inventory_id===v.id))
    if(item&&inventory){guided.current=true;setPanel('inventory');begin({inventoryId:inventory.id,item,x:0,z:0,rotation:0})}
  },[params,state,begin])
  if (loading || !state) return <div className="page"><div className="panel world-loading" role="status">{error ? worldError(error, t) : t('نجهّز مدينتك…', 'Preparing your city…')}</div></div>
  const catalog = state.catalog.length ? state.catalog : CATALOG
  const available = state.inventory.filter(inv => !state.placements.some(p => p.inventory_id === inv.id) && !state.furniture.some(p => p.inventory_id === inv.id) && !catalog.find(item => item.id === inv.catalog_id)?.is_furniture)
  const selected = state.placements.find(p => p.id === selectedId)
  const selectedItem = selected && catalog.find(item => item.id === selected.catalog_id)
  const issue = draft ? placementIssue(draft, state.placements, catalog, state.world.size) : null
  const selectPlacement = (placement: Placement) => { if (busy) return; clear(); setSelectedId(placement.id); setPanel('inventory'); setNotice('') }
  const commit = async () => {
    if (!draft || issue || busy) return
    setBusy(true); setNotice('')
    try {
      const existing = state.placements.find(p => p.id === draft.placementId)
      await mutate(draft.placementId ? 'move' : 'place', draft.placementId ? { placement_id: draft.placementId, x: draft.x, z: draft.z, rotation: draft.rotation, expected_version: draft.expectedVersion ?? existing?.version ?? 0 } : { inventory_id: draft.inventoryId, x: draft.x, z: draft.z, rotation: draft.rotation })
      clear(); setSelectedId(null); setSuccess(true); setNotice(t('حُفظ المكان في مدينتك.', 'Your city placement was saved.'))
    } catch (cause) { setSuccess(false); setNotice(worldError(cause, t)) }
    finally { setBusy(false) }
  }
  const remove = async () => {
    if (!selected || busy) return
    setBusy(true); setNotice('')
    try { await mutate('remove', { placement_id: selected.id, expected_version: selected.version }); setSelectedId(null); setSuccess(true); setNotice(t('عاد العنصر إلى مخزونك دون استرداد عملات.', 'The item returned to your inventory without a coin refund.')) }
    catch (cause) { setSuccess(false); setNotice(worldError(cause, t)) }
    finally { setBusy(false) }
  }
  const expand = async () => {
    if (busy) return
    setBusy(true); setNotice('')
    try { await mutate('land_expand', {}); setExpanding(false); setSuccess(true); setNotice(t('اتّسعت مدينتك. مساحة جديدة لأفكارك.', 'Your city has grown. New space for your ideas.')) }
    catch (cause) { setSuccess(false); setNotice(worldError(cause, t)) }
    finally { setBusy(false) }
  }
  return <div className={`city-page immersive-city ${active ? 'is-playing' : ''}`}>
    {active && <>
      <div className="game-city-label"><span className="world-eyebrow">{t('عالمك الخاص', 'YOUR OWN WORLD')}</span><h1 aria-label={t('مدينتي','My city')}>{t('مدينتي', 'My city')}<span>{t('المستوى', 'LEVEL')} {number(levelFromXp(state.wallet.city_xp))}</span></h1></div>
      <div className="game-city-guide"><FirstCityGuide compact/></div>
      <nav className="game-build-tools" aria-label={t('أدوات المدينة', 'City tools')}>
        {([{id:'inventory',icon:Package,label:t('البناء والمخزون','Build & inventory')},{id:'objects',icon:List,label:t('عناصر مدينتك','City objects')},{id:'share',icon:Share2,label:t('زيارات المدينة','City visits')}] as const).map(({id,icon:Icon,label})=><button key={id} aria-label={label} title={label} data-testid={`city-tool-${id}`} className={panel===id?'active':''} aria-expanded={panel===id} aria-controls="city-tool-panel" onClick={()=>setPanel(panel===id?null:id)}><Icon size={22}/><span>{label}</span>{id==='inventory'&&available.length>0&&<b>{number(available.length)}</b>}</button>)}
      </nav>
    </>}
    <div className="world-layout">
      <div className="city-stage panel">
        <div className="world-stage-top" hidden><span className="world-badge"><span />{t('حيّك الأول', 'Your first neighborhood')}</span><span className="world-badge">{t('المستوى', 'Level')} {number(levelFromXp(state.wallet.city_xp))} · <b dir="ltr">{number(state.world.size)} × {number(state.world.size)}</b></span></div>
        <WorldCanvas placements={state.placements} catalog={catalog} size={state.world.size} draft={draft} valid={!issue} selectedId={selectedId} gridVisible={grid} perspective={perspective} resetKey={resetKey} onSelect={selectPlacement} onTile={(x, z) => { if (draft && !busy) edit({ x, z }) }} />
        {active && <div className="world-camera-tools"><button className={grid ? 'active' : ''} aria-label={t('إظهار أو إخفاء الشبكة', 'Toggle grid')} aria-pressed={grid} onClick={() => setGrid(!grid)}><Grid2X2 size={19} /></button><button aria-label={t('إعادة ضبط الكاميرا', 'Reset camera')} onClick={() => setResetKey(value => value + 1)}><Home size={19} /></button><button aria-label={t('تبديل منظور الكاميرا', 'Switch camera projection')} aria-pressed={perspective} onClick={() => setPerspective(!perspective)}><Maximize2 size={19} /></button></div>}
        <div className="world-stage-bottom"><span>{draft ? t('اختر بلاطة، عدّل الاتجاه، ثم ثبّت.', 'Choose a tile, rotate, then confirm.') : t('اسحب للدوران · قرّب بإصبعين · اختر عنصرًا لتعديله', 'Drag to orbit · Pinch to zoom · Select an object to edit')}</span><span className="world-compass" dir="ltr">{t('ش ↑', 'N ↑')}</span></div>
        {active && !state.placements.length && !draft && !panel && <div className="world-empty-callout"><span>✦</span><strong>{t('هنا تبدأ حكاية مدينتك', 'Your city story begins here')}</strong><p>{available.length ? t('اختر عنصرًا من المخزون وامنحه مكانًا.', 'Choose an inventory item and give it a home.') : t('أكمل مهمة، اجمع عملات، وازرع أول شجرة.', 'Complete an activity, earn coins, and plant your first tree.')}</p></div>}
      </div>
      {active && (panel || draft || selected) && <aside className="builder-sidebar game-build-panel" id="city-tool-panel" aria-label={t('لوحة أدوات المدينة','City tools panel')}>
        <div className="game-build-panel-heading"><strong>{panel==='share'?t('زيارات المدينة','City visits'):panel==='objects'?t('عناصر مدينتك','City objects'):t('ورشة البناء','Build workshop')}</strong><button className="game-close" aria-label={t('إغلاق أدوات البناء','Close building tools')} onClick={()=>{setPanel(null);clear();setSelectedId(null)}}><X size={19}/></button></div>
        {panel==='share' && <CitySharing/>}
        {(panel==='inventory'||draft||selected) && <>
        <section className="panel builder-panel"><div className="world-panel-heading"><div><span className="world-eyebrow">{t('أفكارك أصبحت أماكن', 'MAKE ROOM FOR IDEAS')}</span><h2><Package size={19} /> {t('المخزون', 'Inventory')}</h2></div><span className="world-count" data-testid="inventory-count">{number(available.length)}</span></div>
          <p className="muted small">{t('العناصر المملوكة الجاهزة للبناء. الأثاث في وضع المنزل.', 'Owned items ready to place. Furniture belongs in home interiors.')}</p>
          <div className="world-inventory-list">{available.length ? available.map(inv => {
            const item = catalog.find(entry => entry.id === inv.catalog_id)
            if (!item) return null
            return <button key={inv.id} className={`inventory-item ${draft?.inventoryId === inv.id ? 'active' : ''}`} data-testid={`inventory-${inv.catalog_id}`} onClick={() => { begin({ inventoryId: inv.id, item, x: 0, z: 0, rotation: 0 }); setSelectedId(null); setNotice('') }} disabled={busy}><span className={`catalog-glyph glyph-${item.category}`}>{item.category === 'nature' ? '♧' : item.category === 'homes' ? '⌂' : '◇'}</span><span><strong>{t(item.name_ar, item.name_en)}</strong><small>{item.footprint_x} × {item.footprint_z} {t('بلاطة', 'tiles')}</small></span><Plus size={17} /></button>
          }) : <div className="inventory-empty"><Package size={29} /><strong>{t('مساحة لإلهام جديد', 'Room for fresh inspiration')}</strong><p>{t('مشترياتك تظهر هنا، جاهزة لتشكيل مدينتك.', 'Your purchases appear here, ready to shape your city.')}</p><Link to="/shop" className="button button-secondary">{t('تصفّح العناصر', 'Explore the collection')}</Link></div>}</div>
        </section>
        {draft && <section className="panel builder-panel draft-panel" data-testid="placement-controls"><div className="world-panel-heading"><h2>{t('موضع جديد', 'Placement preview')}</h2><button className="world-icon-button" aria-label={t('إلغاء المعاينة', 'Cancel preview')} onClick={clear}><X size={18} /></button></div><strong>{t(draft.item.name_ar, draft.item.name_en)}</strong><p className={`placement-status ${issue ? 'invalid' : 'valid'}`} data-testid="placement-validity">{issue === 'collision' ? t('المساحة مشغولة', 'Space occupied') : issue === 'bounds' ? t('خارج حدود الأرض', 'Outside owned land') : t('مساحة مناسبة للبناء', 'Ready to place')}</p>
          <div className="coordinate-fields" dir="ltr"><label>X<input aria-label={t('إحداثي X', 'X coordinate')} data-testid="placement-x" type="number" min={0} max={state.world.size - footprint(draft.item, draft.rotation)[0]} value={draft.x} onChange={event => edit({ x: Math.trunc(Number(event.target.value)) })} /></label><label>Z<input aria-label={t('إحداثي Z', 'Z coordinate')} data-testid="placement-z" type="number" min={0} max={state.world.size - footprint(draft.item, draft.rotation)[1]} value={draft.z} onChange={event => edit({ z: Math.trunc(Number(event.target.value)) })} /></label><button aria-label={t('تدوير ٩٠ درجة', 'Rotate 90 degrees')} onClick={() => edit({ rotation: (draft.rotation + 90) % 360 })}><RotateCw size={18} />{draft.rotation}°</button></div>
          <div className="world-move-pad" dir="ltr"><button aria-label={t('نقل شمالًا', 'Move north')} onClick={() => edit({ z: Math.max(0, draft.z - 1) })}><ArrowUp size={17} /></button><button aria-label={t('نقل غربًا', 'Move west')} onClick={() => edit({ x: Math.max(0, draft.x - 1) })}><ArrowLeft size={17} /></button><button aria-label={t('نقل جنوبًا', 'Move south')} onClick={() => edit({ z: Math.min(state.world.size - 1, draft.z + 1) })}><ArrowDown size={17} /></button><button aria-label={t('نقل شرقًا', 'Move east')} onClick={() => edit({ x: Math.min(state.world.size - 1, draft.x + 1) })}><ArrowRight size={17} /></button></div>
          <div className="world-edit-actions"><button className="button button-secondary" disabled={!past.length} aria-label={t('تراجع عن تعديل المعاينة', 'Undo preview edit')} onClick={undo}><Undo2 size={17} /></button><button className="button button-secondary" disabled={!future.length} aria-label={t('إعادة تعديل المعاينة', 'Redo preview edit')} onClick={redo}><Redo2 size={17} /></button><button className="button button-primary" data-testid="commit-placement" disabled={!!issue || busy || !online} onClick={commit}><Check size={18} />{busy ? t('جارٍ الحفظ…', 'Saving…') : t('تثبيت', 'Confirm')}</button></div><p className="muted small">{t('التراجع والإعادة يخصّان المعاينة قبل الحفظ.', 'Undo and redo apply to the unsaved preview.')}</p>
        </section>}
        {selected && selectedItem && !draft && <section className="panel builder-panel"><div className="world-panel-heading"><h2>{t(selectedItem.name_ar, selectedItem.name_en)}</h2><button className="world-icon-button" aria-label={t('إلغاء التحديد', 'Deselect')} onClick={() => setSelectedId(null)}><X size={18} /></button></div><p className="muted" dir="ltr">X {number(selected.x)} · Z {number(selected.z)} · {selected.rotation}°</p><div className="world-selection-actions"><button className="button button-primary" onClick={() => begin({ inventoryId: selected.inventory_id, placementId: selected.id, expectedVersion: selected.version, item: selectedItem, x: selected.x, z: selected.z, rotation: selected.rotation })}><Move size={17} />{t('نقل / تدوير', 'Move / rotate')}</button>{isHouse(selectedItem) && <Link className="button button-secondary" to={`/interior/${selected.id}`}><Home size={17} />{t('دخول المنزل', 'Enter home')}</Link>}<button className="button button-ghost" disabled={busy || !online} onClick={remove}><Trash2 size={17} />{t('إعادة إلى المخزون', 'Return to inventory')}</button></div><p className="muted small">{t('الإزالة تعيد العنصر دون استرداد قيمته. أثاث المنزل يعود أيضًا إلى المخزون.', 'Removal recovers the item without a refund. Interior furniture also returns to inventory.')}</p></section>}
        <section className="panel world-land-card"><span className="world-land-icon"><Grid2X2 size={22} /></span><div><h3>{t('مساحة لأحلام أكبر', 'Space for bigger dreams')}</h3><p>{t('أضف ٤ بلاطات لكل جانب.', 'Add 4 tiles to each side.')}</p></div><button className="button button-secondary" onClick={() => setExpanding(!expanding)} disabled={state.world.size >= 32}>{state.world.size >= 32 ? t('أكبر مساحة', 'Maximum size') : t('توسعة', 'Expand')}</button>{expanding && <div className="world-expand-confirm"><p>{t('تكلفة التوسعة ١٬٠٠٠ عملة. ستزيد الأرض ٤ بلاطات في كل بُعد.', 'Expansion costs 1,000 coins and adds 4 tiles to each dimension.')}</p><button className="button button-primary" disabled={busy || !online || state.wallet.balance < 1000} onClick={expand}>{t('تأكيد التوسعة', 'Confirm expansion')}</button><button className="button button-ghost" onClick={() => setExpanding(false)}>{t('إلغاء', 'Cancel')}</button></div>}</section>
      </>}
      {panel==='objects' && <>    <div className="world-owned-summary"><h2>{t('عناصر مدينتك', 'City objects')} <span>{number(state.placements.length)}</span></h2>{state.placements.length > 0 ? <div className="world-object-list">{state.placements.map(placed => { const item = catalog.find(entry => entry.id === placed.catalog_id); return <button className={selectedId === placed.id ? 'active' : ''} key={placed.id} data-testid={`placement-${placed.id}`} onClick={() => selectPlacement(placed)} aria-label={`${item ? t(item.name_ar, item.name_en) : placed.catalog_id} X ${placed.x} Z ${placed.z}`}><span>{item ? t(item.name_ar, item.name_en) : placed.catalog_id}</span><small dir="ltr">{placed.x}, {placed.z} · {placed.rotation}°</small></button> })}</div> : <p className="muted">{t('أرضك تبدأ خالية. كل ما تبنيه هنا هو من إنجازك.', 'Your plot begins empty. Everything you build here comes from your progress.')}</p>}</div></>}
      </aside>}
    </div>
    {active && !online && <div className="world-notice" role="status">{t('غير متصل — يمكنك استكشاف المدينة وتعديل المعاينة. يتطلب الحفظ اتصالًا.', 'Offline — explore your city and adjust a preview. Saving requires a connection.')}</div>}
    {active && notice && <div className={`world-notice ${success ? 'success' : 'danger'}`} role="status">{notice}{!success && <button className="button button-ghost" onClick={() => void refresh()}>{t('تحديث', 'Refresh')}</button>}</div>}

  </div>
}
