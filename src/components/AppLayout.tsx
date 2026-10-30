import { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { ArrowUpRight, Building2, Check, CheckCheck, CloudOff, Coins, Focus, Heart, House, LayoutDashboard, ListChecks, Menu, MoonStar, Settings, ShoppingBag, Sparkles, TrendingUp, X } from 'lucide-react';
import { useGame } from '../lib/game';
import { useLocale } from '../lib/locale';
import { Button, Notice } from './Common';

export default function AppLayout() {
  const { state, mode, saveStatus, online, error, refresh } = useGame();
  const { t, number, language, setLanguage } = useLocale();
  const [drawer, setDrawer] = useState(false);
  const primary = [
    { path: '/city', icon: Building2, label: t('المدينة', 'City') },
    { path: '/tasks', icon: ListChecks, label: t('المهام', 'Tasks') },
    { path: '/timer', icon: Focus, label: t('المؤقت', 'Focus') },
    { path: '/shop', icon: ShoppingBag, label: t('المتجر', 'Shop') },
    { path: '/settings', icon: Settings, label: t('حسابي', 'Account') },
  ];
  const extra = [
    { path: '/dashboard', icon: LayoutDashboard, label: t('نظرة على يومك', 'Your day') },
    { path: '/prayers', icon: MoonStar, label: t('سجل الصلوات', 'Prayer journal') },
    { path: '/yuyi', icon: Heart, label: t('مساحة ويوي', 'Yuyi space') },
    { path: '/interior', icon: House, label: t('داخل المنزل', 'Home interior') },
    { path: '/stats', icon: TrendingUp, label: t('إحصائياتي', 'My progress') },
  ];
  const status = String(saveStatus);
  const isSaving = status === 'saving';
  const conflict = status.includes('conflict') || status === 'error';
  const statusLabel = !online ? t('غير متصل', 'Offline') : conflict ? t('تحتاج المزامنة إلى مراجعة', 'Sync needs attention') : isSaving ? t('جارٍ الحفظ…', 'Saving…') : mode === 'demo' ? t('محفوظ على هذا الجهاز', 'Saved on this device') : t('تم الحفظ', 'Saved');
  const nav = (items: typeof primary) => items.map(({ path, icon: Icon, label }) => <NavLink key={path} to={path} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setDrawer(false)}><Icon size={21} strokeWidth={1.7} /><span>{label}</span></NavLink>);
  return <div className="app-shell">
    <a href="#main-content" className="skip-link">{t('انتقل إلى المحتوى', 'Skip to content')}</a>
    {drawer && <button className="sidebar-scrim" aria-label={t('إغلاق القائمة', 'Close menu')} onClick={() => setDrawer(false)} />}
    <aside className={`sidebar ${drawer ? 'is-open' : ''}`} aria-label={t('التنقل الرئيسي', 'Main navigation')}>
      <div className="sidebar-top"><Link to="/dashboard" className="brand"><span className="brand-mark"><Building2 size={25} /><span /></span><span><strong>{t('لايف سيتي', 'LifeCity')}<small>3D</small></strong><em>{t('كل إنجاز… حياة', 'Progress, brought to life')}</em></span></Link><button className="icon-button sidebar-close" aria-label={t('إغلاق', 'Close')} onClick={() => setDrawer(false)}><X size={20} /></button></div>
      <p className="nav-caption">{t('عالمك الصغير', 'YOUR LITTLE WORLD')}</p>
      <nav className="sidebar-nav">{nav(primary)}</nav>
      <p className="nav-caption">{t('مساحاتك', 'YOUR SPACES')}</p>
      <nav className="sidebar-nav secondary-nav">{nav(extra)}</nav>
      <div className="sidebar-bottom"><div className="sidebar-note"><Sparkles size={20} /><p>{t('خطوة صغيرة اليوم،', 'One small step today,')}<br /><strong>{t('مدينة أجمل غدًا.', 'a brighter city tomorrow.')}</strong></p></div><button className="language-switch" onClick={() => setLanguage(language === 'ar-SA' ? 'en' : 'ar-SA')}><span>{language === 'ar-SA' ? 'English' : 'العربية'}</span><ArrowUpRight size={16} /></button><Link to="/" className="quiet-link">{t('عن لايف سيتي', 'About LifeCity')}</Link></div>
    </aside>
    <div className="app-body"><header className="topbar"><div className="topbar-heading"><button className="icon-button mobile-menu" onClick={() => setDrawer(true)} aria-label={t('فتح القائمة', 'Open navigation')}><Menu size={23} /></button><span className="topbar-wordmark">{t('مدينتك، على مهل.', 'Your city, at your pace.')}</span><span className={`save-state ${!online || conflict ? 'attention' : ''}`}><span className={`save-dot ${isSaving ? 'is-saving' : ''}`} />{!online ? <CloudOff size={15} /> : isSaving ? <Check size={15} /> : <CheckCheck size={15} />}<span>{statusLabel}</span></span></div><div className="topbar-account"><Link className={`wallet-pill ${(state?.wallet.balance || 0) < 0 ? 'negative' : ''}`} to="/stats"><span className="coin-icon"><Coins size={19} /></span><b dir="ltr" data-testid="wallet-balance">{number(state?.wallet.balance || 0)}</b><span>{state?.profile.currency_label === 'points' ? t('نقطة', 'points') : t('عملات', 'coins')}</span></Link><Link to="/settings" className="avatar" aria-label={t('إعدادات حسابي', 'Account settings')}>{state?.profile.display_name?.trim().slice(0, 1) || t('أ', 'L')}</Link></div></header>
      <main id="main-content" className="main-content">
        {mode === 'demo' && <div className="mode-banner"><SproutIcon /><span>{t('مساحة تجربة محلية', 'Local demo space')}<span className="mode-banner-detail"> — {t('تقدّمك محفوظ في هذا المتصفح فقط. أنشئ حسابًا لحفظه مع الخدمة المهيأة.', 'Your progress stays in this browser. Create an account to save with the configured service.')}</span></span><Link to="/login">{t('إنشاء حساب', 'Create account')}<ArrowUpRight size={15} /></Link></div>}
        {mode === 'local' && <div className="local-service-notice">{t('خدمة تطوير محلية · هذه ليست مزامنة سحابية مستضافة.', 'Local development service · this is not hosted cloud sync.')}</div>}
        {!online && <Notice tone="warning">{t('أنت غير متصل. يمكنك استعراض آخر حفظ؛ الإجراءات التي تغيّر رصيدك متوقفة إلى أن يعود الاتصال.', 'You are offline. Browse your last saved state; actions that change your balance are paused until connection returns.')}</Notice>}
        {(error || conflict) && <Notice tone="danger"><span>{t('تعذّرت مزامنة التقدّم. راجع الاتصال ثم أعد تحميل آخر حالة محفوظة.', 'Progress could not sync. Check your connection and reload the latest saved state.')}</span><Button variant="ghost" onClick={() => void refresh()}>{t('إعادة المحاولة', 'Try again')}</Button></Notice>}
        <Outlet />
      </main><nav className="bottom-nav" aria-label={t('التنقل الرئيسي', 'Main navigation')}>{nav(primary)}</nav>
    </div>
  </div>;
}
function SproutIcon() { return <Sparkles size={17} aria-hidden="true" />; }
