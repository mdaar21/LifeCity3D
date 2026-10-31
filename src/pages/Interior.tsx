import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Armchair, ArrowLeft, ArrowRight, Check, Home, Package, Plus, Redo2, RotateCw, ShoppingBag, Trash2, Undo2, X } from 'lucide-react'
import { useGame } from '../lib/game'
import { useLocale } from '../lib/locale'
import { CATALOG } from '../lib/catalog'
import { WorldCanvas } from '../world/CityScene'
import { isHouse, placementIssue } from '../world/building'
import { useBuilder } from '../world/useBuilder'
import { worldError } from '../world/messages'
import TouchTools from '../world/TouchTools'
import {useTouchTools} from '../world/useTouchTools'
import '../world.css'

export default function Interior() {
  const advanced=useTouchTools(s=>s.advanced)
  const { houseId } = useParams<{ houseId: string }>()
  const { state, loading, error, mutate, online } = useGame()
  const { t, number } = useLocale()
  const { draft, past, future, begin, edit, undo, redo, clear } = useBuilder()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [success, setSuccess] = useState(false)
  const [resetKey, setResetKey] = useState(0)
  useEffect(() => { clear(); setSelectedId(null); return () => clear() }, [clear, houseId])
  if (loading || !state) return <div className="page"><div className="panel world-loading" role="status">{error ? worldError(error, t) : t('نجهّز منزلك…', 'Preparing your home…')}</div></div>
  const catalog = state.catalog.length ? state.catalog : CATALOG
  const houses = state.placements.filter(placed => { const item = catalog.find(entry => entry.id === placed.catalog_id); return item ? isHouse(item) : false })
  const house = houses.find(placed => placed.id === (houseId || houses[0]?.id))
  const houseItem = house && catalog.find(item => item.id === house.catalog_id)
  if (!house || !houseItem) return <div className="page interior-page"><div className="world-page-heading"><div><p className="world-eyebrow">{t('تفاصيل تشبهك', 'DETAILS THAT FEEL LIKE YOU')}</p><h1>{t('داخل المنزل', 'At home')}</h1></div></div><section className="panel interior-empty"><span className="interior-empty-icon"><Home size={38} /></span><h2>{houseId ? t('هذا المنزل غير متاح', 'This home is unavailable') : t('بيت صغير لأحلامك', 'A home for your ideas')}</h2><p>{t('ضع منزلًا أو فيلا أو قصرًا في مدينتك، ثم ادخل إليه لتأثيث غرفة خاصة بك.', 'Place a house, villa, or palace in your city, then step inside to furnish your own room.')}</p><div className="row"><Link to="/city" className="button button-primary"><Home size={17} />{t('إلى مدينتي', 'Go to my city')}</Link><Link to="/shop" className="button button-secondary">{t('استكشف المنازل', 'Explore homes')}</Link></div></section></div>
  const furniture = state.furniture.filter(placed => placed.house_id === house.id)
  const available = state.inventory.filter(inv => catalog.find(item => item.id === inv.catalog_id)?.is_furniture && !state.furniture.some(placed => placed.inventory_id === inv.id) && !state.placements.some(placed => placed.inventory_id === inv.id))
  const selected = furniture.find(placed => placed.id === selectedId)
  const selectedItem = selected && catalog.find(item => item.id === selected.catalog_id)
  const issue = draft ? placementIssue(draft, furniture, catalog, 8) : null
  const commit = async () => {
    if (!draft || issue || busy) return
    setBusy(true); setNotice('')
    try {
      const previous = furniture.find(placed => placed.id === draft.placementId)
      await mutate(draft.placementId ? 'interior_move' : 'interior_place', draft.placementId ? { placement_id: draft.placementId, x: draft.x, z: draft.z, rotation: draft.rotation, expected_version: draft.expectedVersion ?? previous?.version ?? 0 } : { house_id: house.id, inventory_id: draft.inventoryId, x: draft.x, z: draft.z, rotation: draft.rotation })
      clear(); setSelectedId(null); setSuccess(true); setNotice(t('حُفظ ترتيب غرفتك.', 'Your room arrangement was saved.'))
    } catch (cause) { setSuccess(false); setNotice(worldError(cause, t)) }
    finally { setBusy(false) }
  }
  const remove = async () => {
    if (!selected || busy) return
    setBusy(true); setNotice('')
    try { await mutate('interior_remove', { placement_id: selected.id, expected_version: selected.version }); setSelectedId(null); setSuccess(true); setNotice(t('عاد الأثاث إلى المخزون دون استرداد عملات.', 'The furniture returned to inventory without a coin refund.')) }
    catch (cause) { setSuccess(false); setNotice(worldError(cause, t)) }
    finally { setBusy(false) }
  }
  return <div className={`page interior-page ${advanced?'':'beginner-interior'}`}><TouchTools interiorHouseId={house.id}/><div className="world-page-heading"><div><p className="world-eyebrow">{t('أهلًا بك في مساحتك الهادئة', 'WELCOME TO YOUR QUIET CORNER')}</p><h1>{t('على ذوقك', 'Make yourself at home')}</h1><p className="muted">{t('غرفة خاصة في', 'Your own room in')} {t(houseItem.name_ar, houseItem.name_en)} · <span dir="ltr">8 × 8</span></p></div><Link className="button button-secondary" to="/city"><ArrowRight size={17} />{t('العودة للمدينة', 'Back to city')}</Link></div>
    {houses.length > 1 && <nav className="interior-house-tabs" aria-label={t('منازلي', 'My homes')}>{houses.map((placed, index) => { const item = catalog.find(entry => entry.id === placed.catalog_id); return <Link className={placed.id === house.id ? 'active' : ''} to={`/interior/${placed.id}`} key={placed.id}><Home size={16} />{item ? t(item.name_ar, item.name_en) : t('منزل', 'Home')} {number(index + 1)}</Link> })}</nav>}
    <div className="world-layout"><section className="panel city-stage interior-stage"><div className="world-stage-top"><span className="world-badge"><Armchair size={15} />{t('غرفتك الأولى', 'Your first room')}</span><button className="world-badge" onClick={() => setResetKey(value => value + 1)}><Home size={15} />{t('إعادة العرض', 'Reset view')}</button></div><WorldCanvas interior touchGame={state} interiorHouseId={house.id} size={8} placements={furniture} catalog={catalog} selectedId={selectedId} draft={draft} valid={!issue} resetKey={resetKey} gridVisible onTile={(x, z) => { if (draft && !busy) edit({ x, z }) }} onSelect={placed => { if (!busy) { clear(); setSelectedId(placed.id) } }} /><div className="world-stage-bottom"><span>{t('اختر قطعة أثاث، ثم حدّد مكانها في الغرفة.', 'Choose furniture, then choose its spot in the room.')}</span><span dir="ltr">8 × 8</span></div>{!furniture.length && !draft && <div className="world-empty-callout"><span>⌂</span><strong>{t('الراحة تبدأ بتفاصيلك', 'Comfort starts with your details')}</strong><p>{t('مكتب لفكرة، نبتة لنافذة، وركن يشبهك.', 'A desk for an idea. A plant by the window. A corner that feels like you.')}</p></div>}</section>
      <aside className="builder-sidebar"><section className="panel builder-panel"><div className="world-panel-heading"><h2><Armchair size={19} />{t('أثاثي', 'My furniture')}</h2><span className="world-count">{number(available.length)}</span></div><p className="muted small">{t('الأثاث منفصل عن عناصر المدينة ولا يُوضع خارج المنازل.', 'Furniture is separate from city objects and belongs inside homes.')}</p><div className="world-inventory-list">{available.length ? available.map(inv => { const item = catalog.find(entry => entry.id === inv.catalog_id); return item && <button className={`inventory-item ${draft?.inventoryId === inv.id ? 'active' : ''}`} data-testid={`inventory-${item.id}`} key={inv.id} onClick={() => { begin({ inventoryId: inv.id, item, x: 0, z: 0, rotation: 0 }); setSelectedId(null) }} disabled={busy}><span className="catalog-glyph glyph-furniture"><Armchair size={23} /></span><span><strong>{t(item.name_ar, item.name_en)}</strong><small>{item.footprint_x} × {item.footprint_z} {t('بلاطة', 'tiles')}</small></span><Plus size={17} /></button> }) : <div className="inventory-empty"><Package size={29} /><strong>{t('اختر أول قطعة أثاث', 'Choose your first piece')}</strong><p>{t('مكتب، أريكة، نبتة… تفاصيل صغيرة تغيّر الغرفة.', 'A desk, a sofa, a plant… small details change a room.')}</p><Link className="button button-secondary" to="/shop"><ShoppingBag size={17} />{t('متجر الأثاث', 'Furniture collection')}</Link></div>}</div></section>
        {draft && <section className="panel builder-panel draft-panel" data-testid="placement-controls"><div className="world-panel-heading"><h2>{t(draft.item.name_ar, draft.item.name_en)}</h2><button className="world-icon-button" onClick={clear} aria-label={t('إلغاء المعاينة', 'Cancel preview')}><X size={18} /></button></div><p className={`placement-status ${issue ? 'invalid' : 'valid'}`} data-testid="placement-validity">{issue === 'collision' ? t('المكان مشغول', 'Space occupied') : issue === 'bounds' ? t('خارج حدود الغرفة', 'Outside the room') : t('جاهز لوضع الأثاث', 'Ready to place')}</p><div className="coordinate-fields" dir="ltr"><label>X<input type="number" min={0} max={7} value={draft.x} aria-label={t('إحداثي X', 'X coordinate')} data-testid="placement-x" onChange={event => edit({ x: Math.trunc(Number(event.target.value)) })} /></label><label>Z<input type="number" min={0} max={7} value={draft.z} aria-label={t('إحداثي Z', 'Z coordinate')} data-testid="placement-z" onChange={event => edit({ z: Math.trunc(Number(event.target.value)) })} /></label><button onClick={() => edit({ rotation: (draft.rotation + 90) % 360 })} aria-label={t('تدوير ٩٠ درجة', 'Rotate 90 degrees')}><RotateCw size={18} />{draft.rotation}°</button></div><div className="world-edit-actions"><button className="button button-secondary" disabled={!past.length} onClick={undo} aria-label={t('تراجع عن المعاينة', 'Undo preview')}><Undo2 size={17} /></button><button className="button button-secondary" disabled={!future.length} onClick={redo} aria-label={t('إعادة المعاينة', 'Redo preview')}><Redo2 size={17} /></button><button className="button button-primary" disabled={!!issue || busy || !online} onClick={commit} data-testid="commit-placement"><Check size={17} />{busy ? t('جارٍ الحفظ…', 'Saving…') : t('تثبيت', 'Confirm')}</button></div><p className="muted small">{t('التراجع والإعادة للمعاينة غير المحفوظة فقط.', 'Undo and redo affect the unsaved preview only.')}</p></section>}
        {selected && selectedItem && !draft && <section className="panel builder-panel"><div className="world-panel-heading"><h2>{t(selectedItem.name_ar, selectedItem.name_en)}</h2><button className="world-icon-button" aria-label={t('إلغاء التحديد', 'Deselect')} onClick={() => setSelectedId(null)}><X size={17} /></button></div><p className="muted" dir="ltr">X {selected.x} · Z {selected.z} · {selected.rotation}°</p><div className="world-selection-actions"><button className="button button-primary" onClick={() => begin({ inventoryId: selected.inventory_id, placementId: selected.id, expectedVersion: selected.version, item: selectedItem, x: selected.x, z: selected.z, rotation: selected.rotation })}><ArrowLeft size={16} />{t('نقل وتدوير', 'Move and rotate')}</button><button className="button button-ghost" disabled={busy || !online} onClick={remove}><Trash2 size={16} />{t('إعادة للمخزون', 'Return to inventory')}</button></div></section>}
        <div className="panel interior-note"><span>✦</span><h3>{t('زاويتك المفضّلة', 'Your favorite corner')}</h3><p>{t('لا عجلة في التأثيث. كل قطعة اقتنيتها تبقى ملكك ويمكنك إعادة ترتيبها متى شئت.', 'Take your time. Every piece you bought is yours, ready to rearrange whenever you like.')}</p></div>
      </aside></div>
    {!online && <div className="world-notice" role="status">{t('غير متصل — يتطلب حفظ ترتيب الأثاث اتصالًا.', 'Offline — saving furniture arrangements requires a connection.')}</div>}
    {notice && <div className={`world-notice ${success ? 'success' : 'danger'}`} role="status">{notice}</div>}
    <section className="world-owned-summary"><h2>{t('قطع في الغرفة', 'Pieces in the room')} <span>{number(furniture.length)}</span></h2><div className="world-object-list">{furniture.map(placed => { const item = catalog.find(entry => entry.id === placed.catalog_id); return <button className={selectedId === placed.id ? 'active' : ''} key={placed.id} onClick={() => { clear(); setSelectedId(placed.id) }}><span>{item ? t(item.name_ar, item.name_en) : placed.catalog_id}</span><small dir="ltr">{placed.x}, {placed.z} · {placed.rotation}°</small></button> })}</div></section>
  </div>
}
