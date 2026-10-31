import { Suspense, useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Building2, Hammer, Route as RoadIcon, Trees, CheckCheck, CloudOff, Coins, Focus, Heart, House, LayoutDashboard, ListChecks, Menu, MoonStar, Settings, ShoppingBag, TrendingUp, X } from 'lucide-react';
import { useGame } from '../lib/game';
import { useLocale } from '../lib/locale';
import { levelFromXp } from '../lib/rules';
import { Button, LoadingState, Modal, Notice } from './Common';
import City from '../pages/City';
import {appPath} from '../lib/paths';
import {useMoney} from '../lib/useMoney';
import { useStudyHeartbeat } from '../lib/useStudyHeartbeat';
import '../game-shell.css';
import '../stylized-game.css';
import {useWorldUI} from '../world/useWorldUI';

export default function AppLayout() {
  useStudyHeartbeat();
  const { state, mode, saveStatus, online, error, refresh } = useGame();
  const { t, number, language, setLanguage } = useLocale();
  const {format,currency}=useMoney();
  const studioOpen=useWorldUI(s=>s.open),studioTab=useWorldUI(s=>s.tab);
  const location = useLocation();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const cityLink = useRef<HTMLAnchorElement>(null);
  const isCity = location.pathname === '/city';
  const isInterior = location.pathname.startsWith('/interior');
  const primary = [
    { path: '/city', icon: Building2, label: t('المدينة', 'City'), hint: t('عالمك', 'YOUR WORLD') },
    { path: '/tasks', icon: ListChecks, label: t('المهام', 'Missions'), hint: t('أنجز واكسب', 'EARN COINS') },
    { path: '/timer', icon: Focus, label: t('التركيز', 'Focus'), hint: t('وقتك ينمو', 'GROW WITH TIME') },
    { path: '/shop', icon: ShoppingBag, label: t('المتجر', 'Shop'), hint: t('ابنِ أكثر', 'BUILD MORE') },
  ];
  const extra = [
    {path:'/economy',icon:Coins,label:t('المحفظتان والعملات','Wallets & currencies'),hint:t('رصيد مدينتي ودرهم ويوي','My City & Yuyi MAD')},
    { path: '/dashboard', icon: LayoutDashboard, label: t('سجل الرحلة', 'Journey log'), hint: t('يومك ومشروعك القادم', 'Your day & next project') },
    { path: '/prayers', icon: MoonStar, label: t('الصلوات', 'Prayers'), hint: t('سجلّك اليومي', 'Your daily journal') },
    { path: '/yuyi', icon: Heart, label: t('حديقة ويوي', 'Yuyi garden'), hint: t('مساحة مشتركة باختيارك', 'An optional shared space') },
    { path: '/interior', icon: House, label: t('داخل المنزل', 'Home interior'), hint: t('رتّب مساحتك', 'Make it your own') },
    { path: '/stats', icon: TrendingUp, label: t('إنجازاتي', 'Achievements'), hint: t('الإحصاءات ودفتر العملات', 'Progress & coin ledger') },
    { path: '/settings', icon: Settings, label: t('الإعدادات', 'Settings'), hint: t('حسابك وتفضيلاتك', 'Account & preferences') },
  ];
  const current = [...primary, ...extra].find(item => location.pathname.startsWith(item.path));
  const level = levelFromXp(state?.wallet.player_xp ?? 0);
  const levelStart = (level - 1) ** 2 * 100;
  const levelGoal = level ** 2 * 100 - levelStart;
  const xp = (state?.wallet.player_xp ?? 0) - levelStart;
  const activeStudy = state?.study_sessions.find(item => item.status !== 'finished');
  const conflict = saveStatus === 'conflict';
  const statusLabel = !online ? t('غير متصل', 'Offline') : conflict ? t('راجع المزامنة', 'Check sync') : saveStatus === 'saving' ? t('جارٍ الحفظ…', 'Saving…') : mode === 'demo' ? t('محفوظ محليًا', 'Saved locally') : t('تم الحفظ', 'Saved');
  useEffect(() => {
    if (!isCity) heading.current?.focus();
    const close = (event: KeyboardEvent) => {
      // A confirmation dialog owns Escape while it is open.
      if (event.key === 'Escape' && !document.querySelector('[aria-modal="true"]') && !isCity) {
        navigate('/city');
        requestAnimationFrame(() => cityLink.current?.focus());
      }
    };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [location.pathname, isCity, navigate]);
  return <div className="game-shell">
    <a href="#main-content" className="skip-link">{t('انتقل إلى المحتوى', 'Skip to content')}</a>
    <div className="game-world" aria-hidden={!isCity || undefined} inert={!isCity ? true : undefined}>
      {!isInterior && <City active={isCity} />}
    </div>
    <header className="game-hud">
      <Link className="game-player" to="/settings" aria-label={t('إعدادات حسابي', 'Account settings')}>
        <span className="game-avatar">{state?.profile.display_name?.trim().slice(0, 1) || 'L'}<b>{number(level)}</b></span>
        <span className="game-player-copy"><strong>{state?.profile.display_name || t('صانع المدينة', 'City maker')}</strong><span>{t('مستوى اللاعب', 'PLAYER LEVEL')} {number(level)}</span><span className="game-xp" role="progressbar" aria-label={t('التقدم للمستوى التالي', 'Progress to next level')} aria-valuenow={xp} aria-valuemin={0} aria-valuemax={levelGoal}><i style={{width:`${xp / levelGoal * 100}%`}} /></span></span>
      </Link>
      <div className="game-wordmark"><Building2 size={19}/><span>LifeCity <b>3D</b></span></div>
      <div className="game-resources"><div className="game-wallet-pair">
        <Link className={`game-wallet ${(state?.wallet.balance ?? 0) < 0 ? 'negative' : ''}`} to="/stats"><span className="game-coin"><Coins size={23}/></span><span><small>{state?.v6?t('محفظتي','MY CITY')+' · '+currency:state?.profile.currency_label === 'points' ? t('نقاطك', 'POINTS') : t('عملاتك', 'COINS')}</small><b dir="ltr" data-testid="wallet-balance">{currency==='SAR'?number(state?.wallet.balance ?? 0):format(state?.wallet.balance??0)}</b></span></Link>
        {state?.v6&&<Link className="game-wallet game-yuyi-wallet" to="/economy"><Heart size={18}/><span><small>{t('رصيد ويوي','YUYI')} · MAD</small><b data-testid="yuyi-hud">{format(state.v6.yuyi_wallet.balance,'yuyi',true)}</b></span></Link>}</div>
        <button className="game-menu-button" aria-label={t('قائمة اللعبة', 'Game menu')} aria-haspopup="dialog" onClick={() => setMenu(true)}><Menu size={23}/></button>
      </div>
    </header>
    <div className="game-save-line"><span className={!online || conflict ? 'game-save attention' : 'game-save'}>{!online ? <CloudOff size={13}/> : <CheckCheck size={13}/>}<span role="status">{statusLabel}</span></span>{mode === 'demo' && <span className="game-mode">{t('تجربة ضيف · هذا المتصفح فقط', 'GUEST DEMO · THIS BROWSER ONLY')}</span>}{state?.v6?.fx&&<a className="game-mode" href="https://www.exchangerate-api.com" target="_blank" rel="noreferrer">Rates By Exchange Rate API</a>}{mode === 'local' && <span className="game-mode">{t('خادم تطوير محلي', 'LOCAL DEVELOPMENT SERVER')}</span>}</div>
    <div className="game-alerts">
      {!online && <Notice tone="warning">{t('أنت غير متصل. يمكنك استعراض آخر حفظ؛ الإجراءات التي تغيّر رصيدك متوقفة إلى أن يعود الاتصال.', 'You are offline. Browse your last saved state; actions that change your balance are paused until connection returns.')}</Notice>}
      {(error || conflict) && <Notice tone="danger"><span>{error || t('تعذّرت مزامنة التقدّم.', 'Progress could not sync.')}</span><Button variant="ghost" onClick={() => void refresh()}>{t('إعادة المحاولة', 'Try again')}</Button></Notice>}
    </div>
    <main id="main-content" className={isCity ? 'game-city-content' : `game-window ${isInterior ? 'game-interior-window' : ''}`} tabIndex={-1}>
      {!isCity && <><header className="game-window-bar"><div><span className="game-window-emblem">{current && <current.icon size={21}/>}</span><div><small>LifeCity 3D</small><h1 ref={heading} tabIndex={-1}>{current?.label}</h1></div></div><Link className="game-close" to="/city" aria-label={t('إغلاق والعودة للمدينة', 'Close and return to city')}><X size={21}/></Link></header><div className="game-window-scroll" key={location.pathname}><Suspense fallback={<LoadingState/>}><Outlet/></Suspense></div></>}
    </main>
    {activeStudy && location.pathname !== '/timer' && <Link to="/timer" className="game-focus-pill" data-testid="active-focus"><Focus size={17}/><span>{activeStudy.status === 'running' ? t('جلسة تركيز مستمرة', 'Focus session running') : t('جلسة تركيز متوقفة', 'Focus session paused')}</span><b>{number(activeStudy.credited_minutes)} {t('د', 'min')}</b></Link>}
    <nav className="game-dock" aria-label={t('التنقل الرئيسي', 'Main navigation')}>
      {primary.map(({path,icon:Icon,label,hint}) => <NavLink ref={path === '/city' ? cityLink : undefined} key={path} to={path} className={({isActive}) => `game-dock-item ${isActive ? 'active' : ''}`}><span className="game-dock-icon"><Icon size={23}/>{path==='/tasks'&&state?.approved_tasks&&<b className="game-mission-count" aria-label={t('١٦ مهمة وتحدّي','16 tasks and milestones')}>{number(state.approved_tasks.catalog.length)}</b>}{path === '/timer' && activeStudy?.status === 'running' && <i/>}</span><strong>{label}</strong><small>{hint}</small></NavLink>)}
      {([{tab:'build',icon:Hammer,ar:'البناء',en:'Build'},{tab:'networks',icon:RoadIcon,ar:'الطرق',en:'Roads'},{tab:'residents',icon:Trees,ar:'الطبيعة',en:'Greenery'}] as const).map(({tab,icon:Icon,ar,en})=><button key={tab} className="game-dock-item is-tool" aria-label={t(ar,en)} aria-pressed={isCity&&studioOpen&&studioTab===tab} onClick={()=>{navigate('/city');useWorldUI.getState().set({open:true,tab,replay:null,...(tab==='networks'?{overlay:'road'}:{})});}}><span className="game-dock-icon"><Icon size={22}/></span><strong>{t(ar,en)}</strong><small>{t('أدوات العالم','WORLD TOOLS')}</small></button>)}
      <button className={`game-dock-item ${menu ? 'active' : ''}`} aria-label={t('قائمة اللعبة', 'Game menu')} aria-haspopup="dialog" onClick={() => setMenu(true)}><span className="game-dock-icon"><Menu size={23}/></span><strong>{t('المزيد', 'More')}</strong><small>{t('مساحاتك', 'YOUR SPACES')}</small></button>
    </nav>
    <Modal open={menu} onClose={() => setMenu(false)} title={t('قائمة اللعبة', 'Game menu')}>
      <div className="game-menu-grid">{extra.map(({path,icon:Icon,label,hint}) => <Link key={path} to={path} onClick={() => setMenu(false)}><span><Icon size={25}/></span><strong>{label}</strong><small>{hint}</small></Link>)}</div>
      <div className="game-menu-footer"><span data-testid="game-release">{t('تحديث مهام الحياة · ١٦','Life tasks update · 16')}</span>{import.meta.env.PROD&&<a href={appPath('api/update.html')}>{t('تحميل أحدث نسخة مع حفظ التقدّم','Load latest version & keep progress')}</a>}<button className="language-switch button button-secondary" onClick={() => setLanguage(language === 'ar-SA' ? 'en' : 'ar-SA')}>{language === 'ar-SA' ? 'English' : 'العربية'}</button><Link to="/" onClick={() => setMenu(false)}>{t('الشاشة الرئيسية', 'Title screen')}</Link><span>{mode === 'demo' ? t('تجربة محلية', 'Local demo') : t('LifeCity 3D', 'LifeCity 3D')}</span></div>
    </Modal>
  </div>;
}
