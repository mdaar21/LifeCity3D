import { useId, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronDown, Flag, Leaf, ListChecks, MapPin, ShoppingBag, Sprout, X } from 'lucide-react';
import { Link,useLocation } from 'react-router-dom';
import { useGame } from '../lib/game';
import { useLocale } from '../lib/locale';
import type { InventoryItem } from '../lib/types';

function wasDismissed(key: string) {
  try { return localStorage.getItem(key) === 'true'; }
  catch { return false; }
}

/** A guide to genuine account actions. Its local preference only hides the card. */
export default function FirstCityGuide({compact=false}:{compact?:boolean}) {
  const { state, mode } = useGame();
  const { t, number, language } = useLocale();
  const location=useLocation();
  const artId = useId().replace(/:/g, '');
  const [override, setOverride] = useState<{key: string; hidden: boolean} | null>(null);
  if (!state) return null;
  const key = `lifecity-first-guide:${mode}:${state.profile.id}`;
  const hidden = override?.key === key ? override.hidden : wasDismissed(key);
  const setHidden = (value: boolean) => {
    setOverride({key, hidden: value});
    try { localStorage.setItem(key, String(value)); }
    catch { /* This is an optional display preference, never game progress. */ }
  };
  const firstTask = state.completions.length > 0 || state.achievements.some(item => item.key === 'first_task');
  const treeItems = state.inventory.filter(item => item.catalog_id === 'tree');
  const firstTree = treeItems.length > 0;
  const planted = state.placements.some(item => item.catalog_id === 'tree') || treeItems.some(item => !!(item as InventoryItem & {first_placed_at?: string}).first_placed_at);
  const steps = [
    {done: firstTask, icon: ListChecks, title: t('إنجاز من يومك', 'A real-life achievement'), description: t('أنجز مهمة فعلًا، ثم سجّلها لتكسب أول عملاتك.', 'Finish a real task, then record it to earn your first coins.'), action: t('اختر مهمتك الأولى', 'Choose a first task'), to: '/tasks'},
    {done: firstTree, icon: ShoppingBag, title: t('شجرتك الأولى', 'Your first tree'), description: t('اختر الشجرة من المتجر مقابل ٢٠ عملة. الشراء يُحفظ في مخزونك.', 'Choose the 20-coin tree in the shop. Your purchase stays in your inventory.'), action: t('اختر شجرتك', 'Choose your tree'), to: '/shop?item=tree'},
    {done: planted, icon: MapPin, title: t('مكان لبدايتك', 'A place for your beginning'), description: t('افتح مخزون المدينة، اختر الشجرة، ثم أكّد مكانها على الأرض.', 'Open your city inventory, choose the tree and confirm its place on your land.'), action: t('ازرعها في مدينتك', 'Plant it in your city'), to: '/city?guide=tree'},
  ];
  const completed = steps.filter(step => step.done).length;
  const current = steps.findIndex(step => !step.done);
  const complete = completed === steps.length;
  const Arrow = language === 'en' ? ArrowRight : ArrowLeft;

  if (hidden) return <div className="first-guide-reopen"><button type="button" onClick={() => setHidden(false)}><Flag size={15} aria-hidden="true" />{t('دليل بدايتك', 'Your first-city guide')}<ChevronDown size={15} aria-hidden="true" /></button></div>;

  if(compact){const step=steps[Math.max(0,current)];return <section className="first-city-guide first-guide-compact" data-testid="first-city-guide" aria-label={t('خطوتك الأولى في المدينة','Your first city step')}><span className="first-guide-compact-icon">{complete?<Check size={23}/>:<step.icon size={23}/>}</span><div><h2>{complete?t('زرعت أول حكاية.','Your first story is planted.'):step.title}</h2><p>{complete?t('اختر مبناك القادم في المتجر، وامنحه مكانه بنفسك.','Choose your next building in the shop and give it a place yourself.'):step.description}</p><small><bdi dir="ltr">{number(completed)} / {number(steps.length)}</bdi> {t('خطوات مكتملة','steps complete')}</small></div>{!complete&&!step.to.startsWith(location.pathname+'?')&&<Link className="text-link" to={step.to}>{step.action}<Arrow size={15}/></Link>}<button className="icon-button" onClick={()=>setHidden(true)} aria-label={t('إخفاء دليل البداية','Hide first-city guide')}><X size={17}/></button></section>;}

  return <section className={`first-city-guide ${complete ? 'first-city-guide-complete' : ''}`} data-testid="first-city-guide" aria-label={t('دليل بناء أول مدينة', 'Your first city guide')}>
    <div className="first-guide-story"><div className="first-guide-eyebrow"><Flag size={15} aria-hidden="true" /><span>{complete ? t('بداية تستحق الاحتفاء', 'A BEGINNING WORTH CELEBRATING') : t('حكايتك تبدأ بخطوة', 'YOUR STORY STARTS WITH ONE STEP')}</span></div><h2>{complete ? t('زرعت أول حكاية.', 'Your first story is planted.') : t('أول شجرة. ثم عالم كامل.', 'A first tree. Then a whole world.')}</h2><p>{complete ? t('أحسنت. الشجرة أصبحت جزءًا من مدينتك. اختر الآن المبنى الذي تتطلع لبنائه، وواصل بإيقاعك.', 'Well done. That tree is part of your city now. Choose the building you would love next and keep going at your own pace.') : t('ثلاث خطوات قصيرة تعلّمك كيف يتحول إنجازك إلى شيء تراه. ابدأ بمهمة تناسب يومك، ثم ازرع أثرها هنا.', 'Three small steps show how your effort becomes something you can see. Start with a task that fits your day, then plant its progress here.')}</p>
      <div className="first-guide-progress"><span role="status"><bdi dir="ltr">{number(completed)} / {number(steps.length)}</bdi> {t('خطوات مكتملة', 'steps complete')}</span><div role="progressbar" aria-label={t('التقدم في دليل البداية', 'First-city guide progress')} aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={completed}><span style={{width: `${completed / steps.length * 100}%`}} /></div></div>
      <svg className="first-guide-island" viewBox="0 0 300 155" aria-hidden="true"><defs><linearGradient id={`${artId}-ground`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#c6d8a8" /><stop offset="1" stopColor="#8eb787" /></linearGradient></defs><ellipse cx="150" cy="132" rx="127" ry="13" fill="#173b32" opacity=".08" /><path d="M22 89L147 43L279 91L155 140Z" fill="#9b8563" /><path d="M22 80L147 34L279 82L155 131Z" fill={`url(#${artId}-ground)`} /><path d="M71 100L153 70L231 99" fill="none" stroke="#ede0bf" strokeWidth="15" strokeLinejoin="round" /><path d="M169 75V40L198 24L229 41V74L199 86Z" fill="#f1ecdc" /><path d="M163 42L197 14L234 40L200 54Z" fill="#637b65" /><path d="M199 54V85L229 74V41Z" fill="#d5dac9" /><path d="M209 61V75L218 71V58Z" fill="#829f87" /><path d="M98 82V43" stroke="#8c7352" strokeWidth="6" strokeLinecap="round" /><ellipse cx="99" cy="41" rx="23" ry="29" fill={firstTree ? '#628e65' : '#a4bd95'} /><ellipse cx="89" cy="33" rx="14" ry="19" fill={planted ? '#91b97a' : '#bdcda7'} />{planted && <><circle cx="85" cy="103" r="5" fill="#e8b75d" /><circle cx="249" cy="83" r="4" fill="#e79ab6" /><path d="M133 23L137 15M137 29L146 26" stroke="#c39742" strokeWidth="2" strokeLinecap="round" /></>}</svg>
    </div>
    <div className="first-guide-actions"><button className="icon-button first-guide-close" type="button" onClick={() => setHidden(true)} aria-label={t('إخفاء الدليل؛ يمكنك فتحه مجددًا', 'Hide guide; you can reopen it')}><X size={18} /></button><ol className="first-guide-steps">{steps.map((step, index) => <li key={step.to} className={step.done ? 'is-complete' : current === index ? 'is-current' : ''} aria-current={current === index ? 'step' : undefined}><span className="first-guide-step-icon">{step.done ? <Check size={18} aria-hidden="true" /> : <step.icon size={18} aria-hidden="true" />}</span><div><h3>{step.title}</h3><p>{step.description}</p>{current === index && <Link to={step.to} className="text-link">{step.action}<Arrow size={15} aria-hidden="true" /></Link>}</div></li>)}</ol>{complete && <Link className="first-guide-finish" to="/shop"><Sprout size={18} aria-hidden="true" /><span>{t('ما حكايتك التالية؟ استكشف المباني', 'What comes next? Explore buildings')}</span><Arrow size={16} aria-hidden="true" /></Link>}<small className="first-guide-note"><Leaf size={13} aria-hidden="true" />{t('التقدّم يُقرأ من أعمالك المحفوظة. يمكنك إخفاء الدليل في أي وقت.', 'Progress comes from saved actions. Hide this guide whenever you like.')}</small></div>
  </section>;
}
