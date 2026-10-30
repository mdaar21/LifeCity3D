import { useMemo, useRef, useState } from 'react'
import { Link,useSearchParams } from 'react-router-dom'
import { ArrowUpRight, Armchair, Building2, Check, ChevronRight, Coins, Eye, Flower2, Grid2X2, House, LockKeyhole, Package, Search, ShoppingBag, Sparkles, Trees, Waves, Car } from 'lucide-react'
import { useGame } from '../lib/game'
import { useLocale } from '../lib/locale'
import { CATALOG } from '../lib/catalog'
import { levelFromXp } from '../lib/rules'
import type { CatalogItem, Category } from '../lib/types'
import { ItemPreview } from '../world/CityScene'
import { worldError } from '../world/messages'
import DreamProject from '../components/DreamProject'
import '../world.css'

const categories: { id: Category | 'all'; ar: string; en: string; icon: typeof Trees }[] = [
  { id: 'all', ar: 'كل العناصر', en: 'All items', icon: Grid2X2 },
  { id: 'nature', ar: 'طبيعة', en: 'Nature', icon: Trees },
  { id: 'homes', ar: 'منازل', en: 'Homes', icon: House },
  { id: 'roads', ar: 'طرق', en: 'Roads', icon: Grid2X2 },
  { id: 'water', ar: 'مياه', en: 'Water', icon: Waves },
  { id: 'landmarks', ar: 'معالم', en: 'Landmarks', icon: Building2 },
  { id: 'vehicles', ar: 'مركبات', en: 'Vehicles', icon: Car },
  { id: 'furniture', ar: 'أثاث', en: 'Furniture', icon: Armchair },
]

export default function Shop() {
  const { state, loading, error, mutate, online } = useGame()
  const { t, number } = useLocale()
  const [params]=useSearchParams()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<Category | 'all'>('all')
  const [previewId, setPreviewId] = useState(()=>params.get('item')||'house')
  const [buyingId, setBuyingId] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const [success, setSuccess] = useState(false)
  const lock = useRef(false)
  const catalog = state?.catalog.length ? state.catalog : CATALOG
  const filtered = useMemo(() => catalog.filter(item => (category === 'all' || category === item.category) && `${item.name_ar} ${item.name_en} ${item.description_ar} ${item.description_en}`.toLowerCase().includes(query.trim().toLowerCase())), [catalog, category, query])
  if (loading || !state) return <div className="page"><div className="panel world-loading" role="status">{error ? worldError(error, t) : t('نفتح أبواب المتجر…', 'Opening the collection…')}</div></div>
  const currency = state.profile.currency_label === 'points' ? t('نقطة', 'points') : t('عملة', 'coins')
  const level = levelFromXp(state.wallet.city_xp)
  const selected = catalog.find(item => item.id === previewId) || catalog[0]
  const purchase = async (item: CatalogItem) => {
    if (lock.current || !online) return
    lock.current = true; setBuyingId(item.id); setNotice('')
    try { await mutate('purchase', { catalog_id: item.id }); setSuccess(true); setNotice(t(`أُضيف ${item.name_ar} إلى مخزونك. اختر له مكانًا جميلًا.`, `${item.name_en} was added to your inventory. Find it a beautiful spot.`)) }
    catch (cause) { setSuccess(false); setNotice(worldError(cause, t)) }
    finally { lock.current = false; setBuyingId(null) }
  }
  const ownedCount = (id: string) => state.inventory.filter(inv => inv.catalog_id === id).length
  const purchaseLabel = (item: CatalogItem) => item.unlock_level > level ? t(`يتاح في المستوى ${number(item.unlock_level)}`, `Unlocks at level ${number(item.unlock_level)}`) : state.wallet.balance < item.price ? t('رصيد غير كافٍ', 'Insufficient coins') : buyingId === item.id ? t('جارٍ الشراء…', 'Purchasing…') : t('إضافة إلى مخزوني', 'Add to inventory')
  return <div className="page shop-page">
    <div className="world-page-heading"><div><p className="world-eyebrow">{t('تفاصيل صغيرة. عالم أجمل.', 'SMALL DETAILS. A BEAUTIFUL WORLD.')}</p><h1>{t('متجر المدينة', 'The city collection')}</h1><p className="muted">{t('اختر ما يشبهك، وابنِه بإنجازاتك.', 'Find what feels like you. Build it with your progress.')}</p></div><div className="shop-wallet"><span className="shop-coin"><Coins size={23} /></span><div><small>{t('رصيدك المتاح', 'Available balance')}</small><strong dir="ltr">{number(state.wallet.balance)} <span>{currency}</span></strong></div><Link to="/tasks" aria-label={t('اكسب عملات من المهام', 'Earn coins with activities')}><PlusSymbol /></Link></div></div>
    <div className="shop-intro-strip"><Sparkles size={18} /><span>{t('مدينتك، اختيارًا بعد اختيار. جميع العناصر ملك لك بعد شرائها.', 'Your city, one thoughtful choice at a time. Every purchased item is yours to keep.')}</span><Link to="/city">{t('مخزوني', 'My inventory')}<ArrowUpRight size={16} /></Link></div>
    <div className="shop-browse-bar"><label className="shop-search"><Search size={19} /><input type="search" aria-label={t('البحث في المتجر', 'Search the shop')} placeholder={t('عن ماذا تحلم مدينتك؟', 'What does your city dream of?')} value={query} onChange={event => setQuery(event.target.value)} /></label><span className="shop-level"><Flower2 size={17} />{t('مستوى المدينة', 'City level')} {number(level)}</span></div>
    <div className="shop-category-tabs" role="group" aria-label={t('فئات المتجر', 'Shop categories')}>{categories.map(({ id, ar, en, icon: Icon }) => <button key={id} className={category === id ? 'active' : ''} aria-pressed={category === id} onClick={() => setCategory(id)}><Icon size={17} />{t(ar, en)}</button>)}</div>
    {notice && <div className={`world-notice ${success ? 'success' : 'danger'}`} role="status">{success && <Check size={18} />}{notice}{success && <Link to="/city" className="button button-ghost">{t('إلى المدينة', 'Go to city')}<ChevronRight size={16} /></Link>}</div>}
    {!online && <div className="world-notice" role="status">{t('التصفّح متاح دون اتصال. اتصل بالإنترنت لإتمام الشراء.', 'Browse while offline. Reconnect to complete purchases.')}</div>}
    <DreamProject/>
    <div className="shop-content-layout">
      {selected && <aside className="panel shop-showcase"><div className="shop-showcase-label"><span><Eye size={15} />{t('معاينة ثلاثية الأبعاد', 'LIVE 3D PREVIEW')}</span><span>{t('اسحب للدوران', 'Drag to rotate')}</span></div><ItemPreview item={selected} className="shop-item-preview" /><div className="shop-showcase-body"><span className="world-eyebrow">{t(categories.find(c => c.id === selected.category)?.ar || '', categories.find(c => c.id === selected.category)?.en || '')}</span><h2>{t(selected.name_ar, selected.name_en)}</h2><p>{t(selected.description_ar, selected.description_en)}</p><div className="shop-specs"><span><Grid2X2 size={16} /><b dir="ltr">{selected.footprint_x} × {selected.footprint_z}</b> {t('بلاطة', 'tiles')}</span><span><Package size={16} />{t('تملك', 'Owned')}: {number(ownedCount(selected.id))}</span><span><Flower2 size={16} />{t('مستوى', 'Level')} {number(selected.unlock_level)}</span></div><div className="shop-showcase-price"><strong><Coins size={22} />{number(selected.price)}</strong><span>{currency}</span></div><button className="button button-primary" disabled={buyingId !== null || !online || selected.unlock_level > level || state.wallet.balance < selected.price} onClick={() => void purchase(selected)}>{selected.unlock_level > level ? <LockKeyhole size={17} /> : <ShoppingBag size={17} />}{purchaseLabel(selected)}</button><p className="shop-footnote">{selected.is_furniture ? t('الأثاث يوضع داخل منزل تملكه، في وضع التأثيث.', 'Place furniture inside a home you own, in interior mode.') : t('يُضاف إلى المخزون. أنت تختار مكانه في المدينة.', 'Added to inventory. You choose its place in the city.')}</p></div></aside>}
      <section className="shop-results"><div className="shop-results-heading"><h2>{category === 'all' ? t('مجموعة تستحق البناء', 'Worth building for') : t(categories.find(c => c.id === category)?.ar || '', categories.find(c => c.id === category)?.en || '')}</h2><span>{number(filtered.length)} {t('عنصر', 'items')}</span></div><div className="shop-grid">{filtered.map(item => {
        const locked = item.unlock_level > level
        const CategoryIcon = categories.find(c => c.id === item.category)?.icon || Package
        return <article className={`catalog-card ${item.id === selected?.id ? 'selected' : ''} ${locked ? 'locked' : ''}`} key={item.id}><button className={`catalog-card-preview category-${item.category}`} aria-label={t(`معاينة ${item.name_ar} ثلاثية الأبعاد`, `Preview ${item.name_en} in 3D`)} data-testid={`preview-${item.id}`} onClick={() => setPreviewId(item.id)}><span className="catalog-art-base" /><CategoryIcon size={53} strokeWidth={1.2} /><span className="catalog-preview-hint"><Eye size={13} /> 3D</span>{locked && <span className="catalog-lock"><LockKeyhole size={13} />{t('مستوى', 'Level')} {number(item.unlock_level)}</span>}{ownedCount(item.id) > 0 && <span className="catalog-owned"><Check size={12} />{number(ownedCount(item.id))}</span>}</button><div className="catalog-card-body"><h3>{t(item.name_ar, item.name_en)}</h3><p>{t(item.description_ar, item.description_en)}</p><div className="catalog-card-meta"><strong><Coins size={15} />{number(item.price)}</strong><span dir="ltr">{item.footprint_x} × {item.footprint_z}</span></div><button className="button button-secondary catalog-buy" data-testid={`purchase-${item.id}`} aria-label={t(`شراء ${item.name_ar} مقابل ${number(item.price)} ${currency}`, `Buy ${item.name_en} for ${number(item.price)} ${currency}`)} disabled={buyingId !== null || !online || locked || state.wallet.balance < item.price} onClick={() => void purchase(item)}>{locked ? <LockKeyhole size={15} /> : <ShoppingBag size={15} />}{purchaseLabel(item)}</button></div></article>
      })}</div>{!filtered.length && <div className="panel inventory-empty"><Search size={34} /><h3>{t('لم نجد هذا العنصر', 'No items found')}</h3><p>{t('جرّب اسمًا آخر أو استكشف جميع الفئات.', 'Try another name or browse all categories.')}</p><button className="button button-secondary" onClick={() => { setQuery(''); setCategory('all') }}>{t('عرض كل العناصر', 'Show all items')}</button></div>}</section>
    </div>
  </div>
}

function PlusSymbol() { return <span aria-hidden="true">+</span> }
