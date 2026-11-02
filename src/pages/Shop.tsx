import {SHOP_SECTIONS,legacyShopSection,legacyOffSale,shopSection,type ShopSection} from '../lib/shop-catalog';
import {FURNITURE} from '../../supabase/functions/_shared/world-commerce';
import {ShopWorldCatalog} from '../components/ShopWorldCatalog';
import {useTouchTools} from '../world/useTouchTools'
import {footprint} from '../world/building'
import {HorticulturePanel} from '../components/HorticulturePanel'
import {AssetThumbnail} from '../components/AssetThumbnail'
import { useMemo, useRef, useState } from 'react'
import { Link,useNavigate,useSearchParams } from 'react-router-dom'
import { Armchair, Building2, Check, ChevronRight, Coins, Eye, Flower2, Grid2X2, House, LockKeyhole, Package, Search, ShoppingBag, Trees, Waves, Car, X } from 'lucide-react'
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
  const navigate=useNavigate()
  const [lastPurchase,setLastPurchase]=useState<{inventoryId:string;item:CatalogItem;realm:'main'|'yuyi'}|null>(null)
  const [quote,setQuote]=useState<YuyiQuote|null>(null)
  const [params]=useSearchParams()
  const [shelf,setShelf]=useState<ShopSection>(()=>{const item=CATALOG.find(i=>i.id===params.get('item'));return item?legacyShopSection(item):shopSection(params.get('section'));});
  const [buildMode,setBuildMode]=useState<'catalog'|'savings'>(params.get('section')==='projects'?'savings':'catalog');
  const [furnitureRoom,setFurnitureRoom]=useState<'building'|'home'>('building')
  const [query, setQuery] = useState('')
  const [previewExpanded,setPreviewExpanded]=useState(()=>!!params.get('item'))
  const [previewId, setPreviewId] = useState(()=>params.get('item')||'house')
  const [buyingId, setBuyingId] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const [success, setSuccess] = useState(false)
  const lock = useRef(false)
  const catalog = state?.catalog.length ? state.catalog : CATALOG
  const filtered = useMemo(() => catalog.filter(item => !legacyOffSale(item.id)&&legacyShopSection(item)===shelf&&(shelf!=='furniture'||furnitureRoom==='home'||!FURNITURE.some(f=>f.id===item.id)) && `${item.name_ar} ${item.name_en} ${item.description_ar} ${item.description_en}`.toLowerCase().includes(query.trim().toLowerCase())), [catalog,shelf,furnitureRoom,query])
  if (loading || !state) return <div className="page"><div className="panel world-loading" role="status">{error ? worldError(error, t) : t('نفتح أبواب المتجر…', 'Opening the collection…')}</div></div>
  const yuyi=realm==='yuyi'&&!!state.v6
  const balance=yuyi?state.v6!.yuyi_wallet.balance:state.wallet.balance
  const affordable=(item:CatalogItem)=>yuyi?!!fx&&!fx.stale&&!item.is_furniture&&fixed(balance)>=fixed(convertMoney(item.price,fx.mad_rate,2)):state.wallet.balance>=item.price
  const currency = yuyi?'MAD':state.profile.currency_label === 'points' ? t('نقطة', 'points') : t('عملة', 'coins')
  const level = levelFromXp(yuyi?state.v6!.yuyi_world.city_xp:state.wallet.city_xp)
  const selected=filtered.find(item=>item.id===previewId)||filtered[0]
  const sectionInfo=SHOP_SECTIONS.find(s=>s.id===shelf)!
  const itemName=(item:CatalogItem)=>item.id==='car'?t('سيارة عرض للمدينة','City display car'):['house','villa'].includes(item.id)?t(item.name_ar+' جاهزة',item.name_en+' · ready-made'):t(item.name_ar,item.name_en)
  const purchase = async (item: CatalogItem) => {
    if (lock.current || !online) return
    lock.current = true; setBuyingId(item.id); setNotice('')
    try {
      if(yuyi){const response=await mutate('yuyi_quote',{catalog_id:item.id});setQuote(response.result as unknown as YuyiQuote)}
      else{const response=await mutate('purchase',{catalog_id:item.id});setLastPurchase({inventoryId:String(response.result.inventory_id),item,realm:'main'});setSuccess(true);setNotice(t(`أُضيف ${item.name_ar} إلى مخزونك. اختر له مكانًا جميلًا.`,`${item.name_en} was added to your inventory. Find it a beautiful spot.`))}
    }
    catch (cause) { setSuccess(false); setNotice(worldError(cause, t)) }
    finally { lock.current = false; setBuyingId(null) }
  }
  const placePurchase=()=>{if(!lastPurchase)return;selectRealm(lastPurchase.realm);if(lastPurchase.item.is_furniture){void navigate('/interior');return;}if(useTouchTools.getState().advanced){void navigate('/city?panel=inventory');return;}const [width,depth]=footprint(lastPurchase.item,0);useTouchTools.getState().set({pendingDraft:{operation:'legacy_place',request:{inventory_id:lastPurchase.inventoryId},catalogId:lastPurchase.item.id,x:1,z:1,width,depth,rotation:0}});void navigate('/city');}
  const ownedCount = (id: string) => (yuyi?state.v6!.yuyi_inventory:state.inventory).filter(inv => inv.catalog_id === id).length
  const purchaseLabel = (item: CatalogItem) => item.unlock_level > level ? t(`يتاح في المستوى ${number(item.unlock_level)}`, `Unlocks at level ${number(item.unlock_level)}`) : yuyi&&(!fx||fx.stale)?t('مرجع FX صالح مطلوب','Valid FX reference required'):yuyi&&item.is_furniture?t('الأثاث في مدينتي حاليًا','Furniture currently in My City'):!affordable(item) ? t('رصيد غير كافٍ', 'Insufficient coins') : buyingId === item.id ? t('جارٍ الشراء…', 'Purchasing…') : t('إضافة إلى مخزوني', 'Add to inventory')
  return <div className="page shop-page">
    {state.v6&&<div className="shop-territory" role="group" aria-label={t('مدينة الشراء','Purchase territory')}><button aria-pressed={!yuyi} onClick={()=>{selectRealm('main');setQuote(null)}}>{t('مدينتي','My City')}</button><button aria-pressed={yuyi} onClick={()=>{selectRealm('yuyi');setQuote(null)}}>{t('مدينة ويوي · MAD','Yuyi City · MAD')}</button></div>}
    <div className="shop-hero"><ShoppingBag size={30}/><div><h2>{t('كل ما تحتاجه مدينتك','Everything your city needs')}</h2><p>{t('اختر، عاين، ثم أكّد. مشترياتك محفوظة في المخزون.','Choose, preview, then confirm. Your purchases stay in your inventory.')}</p></div></div>
    <div className="game-shop-toolbar"><nav className="game-shop-tabs game-tabs shop-primary-nav" aria-label={t('أقسام المتجر','Shop sections')} data-testid="shop-sections">{SHOP_SECTIONS.map(section=><button key={section.id} data-testid={section.id==='plants'?'shop-plants':'shop-'+section.id+'-tab'} data-source={section.id==='roads'?'legacy-roads':section.id==='vehicles'?'upper-cars':'unified'} aria-pressed={shelf===section.id} className={shelf===section.id?'active':''} onClick={()=>{setShelf(section.id);setQuote(null);setNotice('');}}>{t(section.ar,section.en)}</button>)}</nav><Link className="button button-secondary" to="/city?panel=inventory"><Package size={17}/>{t('المخزون','Inventory')}</Link></div>
    <div className="shop-browse-bar"><label className="shop-search"><Search size={19}/><input type="search" aria-label={t('البحث في المتجر','Search the shop')} placeholder={t('ابحث داخل القسم','Search this collection')} value={query} onChange={event=>setQuery(event.target.value)}/></label><span className="shop-level"><Flower2 size={17}/>{t('مستوى المدينة','City level')} {number(level)}</span></div>
    {shelf==='construction'&&<div className="shop-subsections" role="group" aria-label={t('خيارات المباني','Building options')}><button aria-pressed={buildMode==='catalog'} onClick={()=>setBuildMode('catalog')}>{t('تصفح المباني','Browse buildings')}</button><button data-testid="shop-projects" disabled={yuyi} aria-pressed={buildMode==='savings'} onClick={()=>setBuildMode('savings')}>{t('ادّخر لمبناك','Save for a building')}</button></div>}
    {shelf==='furniture'&&<label className="shop-room-choice">{t('أين ستضع الأثاث؟','Where will you furnish?')}<select aria-label={t('مكان تأثيث الغرفة','Furnishing destination')} value={furnitureRoom} onChange={e=>setFurnitureRoom(e.target.value as 'building'|'home')}><option value="building">{t('طوابق المباني المشيّدة','Constructed building floors')}</option><option value="home">{t('غرف المنازل الجاهزة','Ready-made home rooms')}</option></select></label>}
    {shelf==='construction'&&buildMode==='savings'?<DreamProject/>:<>
    {notice && <div className={`world-notice ${success ? 'success' : 'danger'}`} role="status">{success && <Check size={18} />}{notice}{success&&lastPurchase&&<button className="button button-primary" data-testid="place-last-purchase" onClick={placePurchase}>{lastPurchase.item.is_furniture?t('ضعه في المنزل','Place in home'):t('ضعه في المدينة','Place in city')}</button>}{success && <Link to="/city?panel=inventory" className="button button-ghost">{t('إلى المدينة', 'Go to city')}<ChevronRight size={16} /></Link>}</div>}
    {!online && <div className="world-notice" role="status">{t('التصفّح متاح دون اتصال. اتصل بالإنترنت لإتمام الشراء.', 'Browse while offline. Reconnect to complete purchases.')}</div>}
    {filtered.length>0&&<section className="shop-legacy-collection" data-testid="shop-compatible-products"><h3>{shelf==='construction'?t('مبانٍ جاهزة ومساكن مدمجة','Ready-made & compact buildings'):shelf==='roads'?t('بلاطات الطرق والأرصفة والجسور','Road tiles, paths & bridges'):shelf==='furniture'?t('تجهيزات غرف المنازل','Home room accessories'):t(sectionInfo.ar,sectionInfo.en)}</h3><div className="shop-content-layout">
      {selected && <aside id="shop-selected-preview" className={`panel shop-showcase ${previewExpanded?'is-expanded':''}`}><div className="shop-showcase-label"><span><Eye size={15} />{t('معاينة ثلاثية الأبعاد', 'LIVE 3D PREVIEW')}</span><span>{t('اسحب للدوران', 'Drag to rotate')}</span><button type="button" className="showcase-close" aria-label={t('إغلاق المعاينة','Close preview')} onClick={()=>setPreviewExpanded(false)}><X size={18}/></button></div><ItemPreview item={selected} className="shop-item-preview" /><div className="shop-showcase-body"><span className="world-eyebrow">{t(categories.find(c => c.id === selected.category)?.ar || '', categories.find(c => c.id === selected.category)?.en || '')}</span><h2>{itemName(selected)}</h2><p>{t(selected.description_ar, selected.description_en)}</p><div className="shop-specs"><span><Grid2X2 size={16} /><b dir="ltr">{selected.footprint_x} × {selected.footprint_z}</b> {t('بلاطة', 'tiles')}</span><span><Package size={16} />{t('تملك', 'Owned')}: {number(ownedCount(selected.id))}</span><span><Flower2 size={16} />{t('مستوى', 'Level')} {number(selected.unlock_level)}</span></div><div className="shop-showcase-price"><strong><Coins size={22} />{format(selected.price,yuyi?'yuyi':'main')}</strong><span>{currency}</span></div><button className="button button-primary" disabled={buyingId !== null || !online || selected.unlock_level > level || !affordable(selected)} onClick={() => void purchase(selected)}>{selected.unlock_level > level ? <LockKeyhole size={17} /> : <ShoppingBag size={17} />}{purchaseLabel(selected)}</button><p className="shop-footnote">{selected.is_furniture ? t('الأثاث يوضع داخل منزل تملكه، في وضع التأثيث.', 'Place furniture inside a home you own, in interior mode.') : t('يُضاف إلى المخزون. أنت تختار مكانه في المدينة.', 'Added to inventory. You choose its place in the city.')}</p></div></aside>}
      <section className="shop-results"><div className="shop-results-heading"><h2>{t(sectionInfo.ar,sectionInfo.en)}</h2><span>{number(filtered.length)} {t('عنصر', 'items')}</span></div><div className="shop-grid">{filtered.map(item => {
        const locked = item.unlock_level > level
        return <article className={`catalog-card ${item.id === selected?.id ? 'selected' : ''} ${locked ? 'locked' : ''}`} key={item.id}><button className={`catalog-card-preview category-${item.category}`} aria-label={t(`معاينة ${item.name_ar} ثلاثية الأبعاد`, `Preview ${item.name_en} in 3D`)} data-testid={`preview-${item.id}`} aria-controls="shop-selected-preview" onClick={() => {setPreviewId(item.id);setPreviewExpanded(true);requestAnimationFrame(()=>{if(window.innerWidth<=600)document.getElementById('shop-selected-preview')?.scrollIntoView({block:'start'})})}}><AssetThumbnail assetKey={'legacy:'+item.id} className="catalog-thumbnail" /><span className="catalog-preview-hint"><Eye size={13} /> 3D</span>{locked && <span className="catalog-lock"><LockKeyhole size={13} />{t('مستوى', 'Level')} {number(item.unlock_level)}</span>}{ownedCount(item.id) > 0 && <span className="catalog-owned"><Check size={12} />{number(ownedCount(item.id))}</span>}</button><div className="catalog-card-body"><h3>{itemName(item)}</h3><p>{t(item.description_ar, item.description_en)}</p><div className="catalog-card-meta"><strong><Coins size={15} />{format(item.price,yuyi?'yuyi':'main')}</strong><span dir="ltr">{item.footprint_x} × {item.footprint_z}</span></div><button className="button button-secondary catalog-buy" data-testid={`purchase-${item.id}`} aria-label={t(`شراء ${item.name_ar} مقابل ${format(item.price,yuyi?'yuyi':'main')} ${currency}`, `Buy ${item.name_en} for ${format(item.price,yuyi?'yuyi':'main')} ${currency}`)} disabled={buyingId !== null || !online || locked || !affordable(item)} onClick={() => void purchase(item)}>{locked ? <LockKeyhole size={15} /> : <ShoppingBag size={15} />}{purchaseLabel(item)}</button></div></article>
      })}</div>{!filtered.length && <div className="panel inventory-empty"><Search size={34} /><h3>{t('لم نجد هذا العنصر', 'No items found')}</h3><p>{t('جرّب اسمًا آخر أو استكشف جميع الفئات.', 'Try another name or browse all categories.')}</p><button className="button button-secondary" onClick={() => { setQuery('') }}>{t('عرض كل العناصر', 'Show all items')}</button></div>}</section>
    </div></section>}
    {['construction','roads','vehicles'].includes(shelf)||shelf==='furniture'&&furnitureRoom==='building'?<ShopWorldCatalog key={shelf+realm} section={shelf as 'construction'|'roads'|'furniture'|'vehicles'} query={query} hideSearch/>:null}
    {shelf==='plants'&&<HorticulturePanel key={realm} query={query}/>}
    </>}
    <Modal open={!!quote} onClose={()=>setQuote(null)} title={t('تأكيد شراء لمدينة ويوي','Confirm Yuyi City purchase')}>
      {quote&&<><p>{format(String(quote.mad_cost),'yuyi',true)}</p><p>{t('يُخصم من رصيد ويوي فقط. صلاحية العرض دقيقتان.','Debited only from Yuyi MAD. Quote valid for two minutes.')}</p><Button disabled={buyingId!==null||!online} onClick={async()=>{if(lock.current)return;lock.current=true;setBuyingId(quote.catalog_id);try{const response=await mutate('yuyi_purchase',{quote_id:quote.id});setLastPurchase({inventoryId:String(response.result.inventory_id),item:catalog.find(c=>c.id===quote.catalog_id)!,realm:'yuyi'});setQuote(null);setSuccess(true);setNotice(t('أُضيف إلى مخزون مدينة ويوي.','Added to Yuyi City inventory.'))}catch(e){setSuccess(false);setNotice(worldError(e,t))}finally{lock.current=false;setBuyingId(null)}}}>{t('تأكيد الخصم من MAD','Confirm MAD purchase')}</Button></>}
    </Modal>
  </div>
}
