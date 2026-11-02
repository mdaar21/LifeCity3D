import {ProductCard} from '../components/ProductCard';
import {NextProducts} from '../components/ProductProgress';
import {SHOP_SECTIONS,legacyShopSection,legacyOffSale,shopSection,type ShopSection} from '../lib/shop-catalog';
import {FURNITURE} from '../../supabase/functions/_shared/world-commerce';
import {ShopWorldCatalog} from '../components/ShopWorldCatalog';
import {useTouchTools} from '../world/useTouchTools'
import {footprint} from '../world/building'
import {HorticulturePanel} from '../components/HorticulturePanel'
import { useMemo, useRef, useState } from 'react'
import { Link,useNavigate,useSearchParams } from 'react-router-dom'
import { Armchair, Building2, Check, ChevronRight, Flower2, Grid2X2, LockKeyhole, Package, Search, Trees, Waves, Car } from 'lucide-react'
import { useGame } from '../lib/game'
import { useLocale } from '../lib/locale'
import { CATALOG } from '../lib/catalog'
import { levelFromXp } from '../lib/rules'
import type { CatalogItem } from '../lib/types'
import { ItemPreview } from '../world/CityScene'
import { worldError } from '../world/messages'
import {Modal,Button} from '../components/Common'
import {useTerritory} from '../lib/useTerritory'
import {useMoney} from '../lib/useMoney'
import {convertMoney,fixed} from '../lib/money'
import type {YuyiQuote} from '../lib/v6-types'
import DreamProject from '../components/DreamProject'
import '../world.css'

const sectionIcons={construction:Building2,roads:Grid2X2,vehicles:Car,plants:Trees,furniture:Armchair,water:Waves};

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
  const level = levelFromXp(Math.max(state.wallet.player_xp,yuyi?state.v6!.yuyi_world.city_xp:state.wallet.city_xp))
  const selected=filtered.find(item=>item.id===previewId)||filtered[0]
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
  const legacyProducts=<>{filtered.map(item=>{const locked=item.unlock_level>level;return <ProductCard key={item.id} className="catalog-card" title={itemName(item)} asset={'legacy:'+item.id} price={format(item.price,yuyi?'yuyi':'main')} badge={<span className="product-access" data-required-level={item.unlock_level}>{locked?<LockKeyhole size={14}/>:<Check size={14}/>} {t('مستوى','Level')} {number(item.unlock_level)}</span>} caption={item.is_furniture?t('أثاث لغرف المنازل الجاهزة','Furniture for ready-made rooms'):t('جاهز للوضع من المخزون','Ready to place from inventory')} meta={<span dir="ltr">{item.footprint_x} × {item.footprint_z} {t('بلاطة','tiles')}</span>} action={purchaseLabel(item)} testId={'purchase-'+item.id} previewTestId={'preview-'+item.id} locked={locked} disabled={buyingId!==null||!online||locked||!affordable(item)} onAction={()=>void purchase(item)} onPreview={()=>{setPreviewId(item.id);setPreviewExpanded(true);}}/>;})}</>;
  return <div className="page shop-page">
    <div className="shop-header-tools">{state.v6&&<label className="shop-city-choice"><Building2 size={17}/><span>{t('مدينة الشراء','Purchase city')}</span><select aria-label={t('مدينة الشراء','Purchase city')} value={yuyi?'yuyi':'main'} onChange={event=>{selectRealm(event.target.value as 'main'|'yuyi');setQuote(null);}}><option value="main">{t('مدينتي','My City')}</option><option value="yuyi">{t('مدينة ويوي · MAD','Yuyi City · MAD')}</option></select></label>}<Link className="button button-secondary" data-testid="touch-inventory" to="/city?panel=inventory"><Package size={17}/>{t('المخزون','Inventory')}</Link></div>

    <div className="game-shop-toolbar"><nav className="game-shop-tabs game-tabs shop-primary-nav" aria-label={t('أقسام المتجر','Shop sections')} data-testid="shop-sections">{SHOP_SECTIONS.map(section=>{const Icon=sectionIcons[section.id];return <button key={section.id} data-testid={section.id==='plants'?'shop-plants':'shop-'+section.id+'-tab'} data-source={section.id==='roads'?'legacy-roads':section.id==='vehicles'?'upper-cars':'unified'} aria-pressed={shelf===section.id} className={shelf===section.id?'active':''} onClick={()=>{setShelf(section.id);setQuote(null);setNotice('');}}><Icon aria-hidden="true" size={18}/>{t(section.ar,section.en)}</button>;})}</nav></div>
    <div className="shop-browse-bar"><label className="shop-search"><Search size={19}/><input type="search" aria-label={t('البحث في المتجر','Search the shop')} placeholder={t('ابحث داخل القسم','Search this collection')} value={query} onChange={event=>setQuery(event.target.value)}/></label><span className="shop-level"><Flower2 size={17}/>{t('مستوى المتجر','Shop level')} {number(level)}</span></div>
    {shelf==='construction'&&buildMode==='savings'&&<button className="button button-secondary" onClick={()=>setBuildMode('catalog')}>{t('العودة للمباني','Back to buildings')}</button>}
    {shelf==='furniture'&&<label className="shop-room-choice">{t('أين ستضع الأثاث؟','Where will you furnish?')}<select aria-label={t('مكان تأثيث الغرفة','Furnishing destination')} value={furnitureRoom} onChange={e=>setFurnitureRoom(e.target.value as 'building'|'home')}><option value="building">{t('طوابق المباني المشيّدة','Constructed building floors')}</option><option value="home">{t('غرف المنازل الجاهزة','Ready-made home rooms')}</option></select></label>}
    {shelf==='construction'&&buildMode==='savings'?<DreamProject/>:<>
    {notice && <div className={`world-notice ${success ? 'success' : 'danger'}`} role="status">{success && <Check size={18} />}{notice}{success&&lastPurchase&&<button className="button button-primary" data-testid="place-last-purchase" onClick={placePurchase}>{lastPurchase.item.is_furniture?t('ضعه في المنزل','Place in home'):t('ضعه في المدينة','Place in city')}</button>}{success && <Link to="/city?panel=inventory" className="button button-ghost">{t('إلى المدينة', 'Go to city')}<ChevronRight size={16} /></Link>}</div>}
    {!online && <div className="world-notice" role="status">{t('التصفّح متاح دون اتصال. اتصل بالإنترنت لإتمام الشراء.', 'Browse while offline. Reconnect to complete purchases.')}</div>}
    {['construction','roads','vehicles'].includes(shelf)||shelf==='furniture'&&furnitureRoom==='building'?<ShopWorldCatalog key={shelf+realm} section={shelf as 'construction'|'roads'|'furniture'|'vehicles'} query={query} hideSearch legacyProducts={legacyProducts} secondaryAction={shelf==='construction'?<button className="shop-project-toggle" data-testid="shop-projects" disabled={yuyi} onClick={()=>setBuildMode('savings')}>{t('ادّخر لمبناك','Save for a building')}</button>:undefined}/>:shelf==='plants'?<HorticulturePanel key={realm} query={query} shop legacyProducts={legacyProducts}/>:<div className="unified-product-grid" data-testid="unified-product-grid">{legacyProducts}</div>}

    <p className="catalog-empty">{t('لا توجد منتجات مطابقة. جرّب اسمًا آخر.','No matching products. Try another name.')}</p>
    </>}
    <details className="shop-discovery"><summary>{t('اكتشف المنتجات والمستويات القادمة','Explore upcoming products & levels')}</summary><NextProducts level={level} section={shelf}/></details>
    <Modal open={previewExpanded&&!!selected} onClose={()=>setPreviewExpanded(false)} title={selected?itemName(selected):''}>{selected&&<div className="product-detail"><ItemPreview item={selected} className="shop-item-preview"/><p>{t(selected.description_ar,selected.description_en)}</p><p>{t('تملك','Owned')}: {number(ownedCount(selected.id))} · {t('مستوى','Level')} {number(selected.unlock_level)}</p><strong>{format(selected.price,yuyi?'yuyi':'main')}</strong><Button disabled={buyingId!==null||!online||selected.unlock_level>level||!affordable(selected)} onClick={()=>{setPreviewExpanded(false);void purchase(selected);}}>{purchaseLabel(selected)}</Button></div>}</Modal>
    <Modal open={!!quote} onClose={()=>setQuote(null)} title={t('تأكيد شراء لمدينة ويوي','Confirm Yuyi City purchase')}>
      {quote&&<><p>{format(String(quote.mad_cost),'yuyi',true)}</p><p>{t('يُخصم من رصيد ويوي فقط. صلاحية العرض دقيقتان.','Debited only from Yuyi MAD. Quote valid for two minutes.')}</p><Button disabled={buyingId!==null||!online} onClick={async()=>{if(lock.current)return;lock.current=true;setBuyingId(quote.catalog_id);try{const response=await mutate('yuyi_purchase',{quote_id:quote.id});setLastPurchase({inventoryId:String(response.result.inventory_id),item:catalog.find(c=>c.id===quote.catalog_id)!,realm:'yuyi'});setQuote(null);setSuccess(true);setNotice(t('أُضيف إلى مخزون مدينة ويوي.','Added to Yuyi City inventory.'))}catch(e){setSuccess(false);setNotice(worldError(e,t))}finally{lock.current=false;setBuyingId(null)}}}>{t('تأكيد الخصم من MAD','Confirm MAD purchase')}</Button></>}
    </Modal>
  </div>
}
