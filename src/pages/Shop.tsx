import { useMemo, useRef, useState } from 'react'
import { Link,useSearchParams } from 'react-router-dom'
import { Armchair, Building2, Check, ChevronRight, Coins, Eye, Flower2, Grid2X2, House, LockKeyhole, Package, Search, ShoppingBag, Trees, Waves, Car } from 'lucide-react'
import { useGame } from '../lib/game'
import { useLocale } from '../lib/locale'
import { CATALOG } from '../lib/catalog'
import { levelFromXp } from '../lib/rules'
import type { CatalogItem, Category } from '../lib/types'
import { ItemPreview } from '../world/CityScene'
import { worldError } from '../world/messages'
import {Modal,Button} from '../components/Common'
import {useTerritory} from '../lib/useTerritory'
import {useMoney} from '../lib/useMoney'
import {convertMoney,fixed} from '../lib/money'
import type {YuyiQuote} from '../lib/v6-types'
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
  const {realm,select:selectRealm}=useTerritory()
  const {format,fx}=useMoney()
  const [quote,setQuote]=useState<YuyiQuote|null>(null)
  const [params]=useSearchParams()
  const [shelf,setShelf] = useState<'items'|'projects'>('items')
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
  const yuyi=realm==='yuyi'&&!!state.v6
  const balance=yuyi?state.v6!.yuyi_wallet.balance:state.wallet.balance
  const affordable=(item:CatalogItem)=>yuyi?!!fx&&!fx.stale&&!item.is_furniture&&fixed(balance)>=fixed(convertMoney(item.price,fx.mad_rate,2)):state.wallet.balance>=item.price
  const currency = yuyi?'MAD':state.profile.currency_label === 'points' ? t('نقطة', 'points') : t('عملة', 'coins')
  const level = levelFromXp(yuyi?state.v6!.yuyi_world.city_xp:state.wallet.city_xp)
  const selected = catalog.find(item => item.id === previewId) || catalog[0]
  const purchase = async (item: CatalogItem) => {
    if (lock.current || !online) return
    lock.current = true; setBuyingId(item.id); setNotice('')
    try {
      if(yuyi){const response=await mutate('yuyi_quote',{catalog_id:item.id});setQuote(response.result as unknown as YuyiQuote)}
      else{await mutate('purchase',{catalog_id:item.id});setSuccess(true);setNotice(t(`أُضيف ${item.name_ar} إلى مخزونك. اختر له مكانًا جميلًا.`,`${item.name_en} was added to your inventory. Find it a beautiful spot.`))}
    }
    catch (cause) { setSuccess(false); setNotice(worldError(cause, t)) }
    finally { lock.current = false; setBuyingId(null) }
  }
  const ownedCount = (id: string) => (yuyi?state.v6!.yuyi_inventory:state.inventory).filter(inv => inv.catalog_id === id).length
  const purchaseLabel = (item: CatalogItem) => item.unlock_level > level ? t(`يتاح في المستوى ${number(item.unlock_level)}`, `Unlocks at level ${number(item.unlock_level)}`) : yuyi&&(!fx||fx.stale)?t('مرجع FX صالح مطلوب','Valid FX reference required'):yuyi&&item.is_furniture?t('الأثاث في مدينتي حاليًا','Furniture currently in My City'):!affordable(item) ? t('رصيد غير كافٍ', 'Insufficient coins') : buyingId === item.id ? t('جارٍ الشراء…', 'Purchasing…') : t('إضافة إلى مخزوني', 'Add to inventory')
  return <div className="page shop-page">
    {state.v6&&<div className="shop-territory" role="group" aria-label={t('مدينة الشراء','Purchase territory')}><button aria-pressed={!yuyi} onClick={()=>{selectRealm('main');setQuote(null)}}>{t('مدينتي','My City')}</button><button aria-pressed={yuyi} onClick={()=>{selectRealm('yuyi');setQuote(null);setShelf('items')}}>{t('مدينة ويوي · MAD','Yuyi City · MAD')}</button></div>}
    <div className="game-shop-toolbar"><div className="game-shop-tabs" role="group" aria-label={t('أقسام المتجر','Shop sections')}><button aria-pressed={shelf==='items'} className={shelf==='items'?'active':''} onClick={()=>setShelf('items')}><ShoppingBag size={17}/>{t('العناصر','Items')}</button><button disabled={yuyi} aria-pressed={shelf==='projects'} className={shelf==='projects'?'active':''} onClick={()=>setShelf('projects')}><Building2 size={17}/>{t('مشاريع البناء','Building projects')}</button></div><Link className="button button-secondary" to="/city?panel=inventory"><Package size={17}/>{t('المخزون','Inventory')}</Link></div>
    {shelf==='projects'?<DreamProject/>:<>
    <div className="shop-browse-bar"><label className="shop-search"><Search size={19} /><input type="search" aria-label={t('البحث في المتجر', 'Search the shop')} placeholder={t('عن ماذا تحلم مدينتك؟', 'What does your city dream of?')} value={query} onChange={event => setQuery(event.target.value)} /></label><span className="shop-level"><Flower2 size={17} />{t('مستوى المدينة', 'City level')} {number(level)}</span></div>
    <div className="shop-category-tabs" role="group" aria-label={t('فئات المتجر', 'Shop categories')}>{categories.map(({ id, ar, en, icon: Icon }) => <button key={id} className={category === id ? 'active' : ''} aria-pressed={category === id} onClick={() => setCategory(id)}><Icon size={17} />{t(ar, en)}</button>)}</div>
    {notice && <div className={`world-notice ${success ? 'success' : 'danger'}`} role="status">{success && <Check size={18} />}{notice}{success && <Link to="/city?panel=inventory" className="button button-ghost">{t('إلى المدينة', 'Go to city')}<ChevronRight size={16} /></Link>}</div>}
    {!online && <div className="world-notice" role="status">{t('التصفّح متاح دون اتصال. اتصل بالإنترنت لإتمام الشراء.', 'Browse while offline. Reconnect to complete purchases.')}</div>}
    <div className="shop-content-layout">
      {selected && <aside className="panel shop-showcase"><div className="shop-showcase-label"><span><Eye size={15} />{t('معاينة ثلاثية الأبعاد', 'LIVE 3D PREVIEW')}</span><span>{t('اسحب للدوران', 'Drag to rotate')}</span></div><ItemPreview item={selected} className="shop-item-preview" /><div className="shop-showcase-body"><span className="world-eyebrow">{t(categories.find(c => c.id === selected.category)?.ar || '', categories.find(c => c.id === selected.category)?.en || '')}</span><h2>{t(selected.name_ar, selected.name_en)}</h2><p>{t(selected.description_ar, selected.description_en)}</p><div className="shop-specs"><span><Grid2X2 size={16} /><b dir="ltr">{selected.footprint_x} × {selected.footprint_z}</b> {t('بلاطة', 'tiles')}</span><span><Package size={16} />{t('تملك', 'Owned')}: {number(ownedCount(selected.id))}</span><span><Flower2 size={16} />{t('مستوى', 'Level')} {number(selected.unlock_level)}</span></div><div className="shop-showcase-price"><strong><Coins size={22} />{format(selected.price,yuyi?'yuyi':'main')}</strong><span>{currency}</span></div><button className="button button-primary" disabled={buyingId !== null || !online || selected.unlock_level > level || !affordable(selected)} onClick={() => void purchase(selected)}>{selected.unlock_level > level ? <LockKeyhole size={17} /> : <ShoppingBag size={17} />}{purchaseLabel(selected)}</button><p className="shop-footnote">{selected.is_furniture ? t('الأثاث يوضع داخل منزل تملكه، في وضع التأثيث.', 'Place furniture inside a home you own, in interior mode.') : t('يُضاف إلى المخزون. أنت تختار مكانه في المدينة.', 'Added to inventory. You choose its place in the city.')}</p></div></aside>}
      <section className="shop-results"><div className="shop-results-heading"><h2>{category === 'all' ? t('مجموعة تستحق البناء', 'Worth building for') : t(categories.find(c => c.id === category)?.ar || '', categories.find(c => c.id === category)?.en || '')}</h2><span>{number(filtered.length)} {t('عنصر', 'items')}</span></div><div className="shop-grid">{filtered.map(item => {
        const locked = item.unlock_level > level
        const CategoryIcon = categories.find(c => c.id === item.category)?.icon || Package
        return <article className={`catalog-card ${item.id === selected?.id ? 'selected' : ''} ${locked ? 'locked' : ''}`} key={item.id}><button className={`catalog-card-preview category-${item.category}`} aria-label={t(`معاينة ${item.name_ar} ثلاثية الأبعاد`, `Preview ${item.name_en} in 3D`)} data-testid={`preview-${item.id}`} onClick={() => setPreviewId(item.id)}><span className="catalog-art-base" /><CategoryIcon size={53} strokeWidth={1.2} /><span className="catalog-preview-hint"><Eye size={13} /> 3D</span>{locked && <span className="catalog-lock"><LockKeyhole size={13} />{t('مستوى', 'Level')} {number(item.unlock_level)}</span>}{ownedCount(item.id) > 0 && <span className="catalog-owned"><Check size={12} />{number(ownedCount(item.id))}</span>}</button><div className="catalog-card-body"><h3>{t(item.name_ar, item.name_en)}</h3><p>{t(item.description_ar, item.description_en)}</p><div className="catalog-card-meta"><strong><Coins size={15} />{format(item.price,yuyi?'yuyi':'main')}</strong><span dir="ltr">{item.footprint_x} × {item.footprint_z}</span></div><button className="button button-secondary catalog-buy" data-testid={`purchase-${item.id}`} aria-label={t(`شراء ${item.name_ar} مقابل ${format(item.price,yuyi?'yuyi':'main')} ${currency}`, `Buy ${item.name_en} for ${format(item.price,yuyi?'yuyi':'main')} ${currency}`)} disabled={buyingId !== null || !online || locked || !affordable(item)} onClick={() => void purchase(item)}>{locked ? <LockKeyhole size={15} /> : <ShoppingBag size={15} />}{purchaseLabel(item)}</button></div></article>
      })}</div>{!filtered.length && <div className="panel inventory-empty"><Search size={34} /><h3>{t('لم نجد هذا العنصر', 'No items found')}</h3><p>{t('جرّب اسمًا آخر أو استكشف جميع الفئات.', 'Try another name or browse all categories.')}</p><button className="button button-secondary" onClick={() => { setQuery(''); setCategory('all') }}>{t('عرض كل العناصر', 'Show all items')}</button></div>}</section>
    </div>
    </>}
    <Modal open={!!quote} onClose={()=>setQuote(null)} title={t('تأكيد شراء لمدينة ويوي','Confirm Yuyi City purchase')}>
      {quote&&<><p>{format(String(quote.mad_cost),'yuyi',true)}</p><p>{t('يُخصم من رصيد ويوي فقط. صلاحية العرض دقيقتان.','Debited only from Yuyi MAD. Quote valid for two minutes.')}</p><Button disabled={buyingId!==null||!online} onClick={async()=>{if(lock.current)return;lock.current=true;setBuyingId(quote.catalog_id);try{await mutate('yuyi_purchase',{quote_id:quote.id});setQuote(null);setSuccess(true);setNotice(t('أُضيف إلى مخزون مدينة ويوي.','Added to Yuyi City inventory.'))}catch(e){setSuccess(false);setNotice(worldError(e,t))}finally{lock.current=false;setBuyingId(null)}}}>{t('تأكيد الخصم من MAD','Confirm MAD purchase')}</Button></>}
    </Modal>
  </div>
}
