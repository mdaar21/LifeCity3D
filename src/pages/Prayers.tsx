import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronDown, Coins, History, Moon, MoonStar, PencilLine, Sun, Sunrise, Sunset } from 'lucide-react';
import { useGame } from '../lib/game';
import { useLocale } from '../lib/locale';
import type { Prayer, PrayerStatus } from '../lib/types';
import { Button, LoadingState, Modal, Notice, SectionTitle } from '../components/Common';

export default function Prayers() {
  const { state, loading, mutate, online } = useGame();
  const { t, number, date } = useLocale();
  const [selection, setSelection] = useState<{prayer: Prayer; day: string; name: string; status: PrayerStatus} | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{text: string; error: boolean} | null>(null);
  const [history, setHistory] = useState(false);
  const prayers = [
    {key: 'fajr' as const, name: t('الفجر', 'Fajr'), reward: 30, icon: Sunrise},
    {key: 'dhuhr' as const, name: t('الظهر', 'Dhuhr'), reward: 20, icon: Sun},
    {key: 'asr' as const, name: t('العصر', 'Asr'), reward: 20, icon: Sun},
    {key: 'maghrib' as const, name: t('المغرب', 'Maghrib'), reward: 20, icon: Sunset},
    {key: 'isha' as const, name: t('العشاء', 'Isha'), reward: 20, icon: Moon},
  ];
  const statusName = (status: PrayerStatus) => status === 'completed' ? t('أديتها', 'Completed') : status === 'excused' ? t('بعذر', 'Excused') : status === 'missed' ? t('فاتتني بتأكيد مني', 'Confirmed missed') : t('لم أسجّل بعد', 'Not logged yet');
  if (loading || !state) return <LoadingState />;
  const today = state.prayers.filter(entry => entry.day === state.local_day);
  const completed = today.filter(entry => entry.status === 'completed').length;
  async function save(status: PrayerStatus) {
    if (!selection || busy) return;
    setBusy(true); setMessage(null);
    try { await mutate('prayer_set', {prayer: selection.prayer, day: selection.day, status, confirmed_missed: status === 'missed'}); setSelection(null); setMessage({text: t('حُفظ اختيارك مع سجل تدقيق. يمكنك تصحيحه عند الحاجة.', 'Your choice was saved with an audit record. You can correct it when needed.'), error: false}); }
    catch { setMessage({text: t('تعذّر حفظ الاختيار. راجع الاتصال وحاول مجددًا.', 'Your choice could not be saved. Check your connection and try again.'), error: true}); }
    finally { setBusy(false); }
  }
  const historyDays = [...new Set(state.prayers.map(entry => entry.day))].filter(day => day !== state.local_day).sort().reverse().slice(0, 7);
  return <div className="page prayers-page"><SectionTitle eyebrow={t('لحظات لها مكان', 'MOMENTS THAT MATTER')} title={t('سجل الصلوات', 'Your prayer journal')} description={t('سجل شخصي بإيقاعك، وخصوصية لك افتراضيًا. لا نفترض ما لم تسجّله.', 'A personal journal at your pace, private by default. Nothing is assumed when you have not logged it.')} />
    <section className="prayer-day-banner"><div className="prayer-day-art"><MoonStar size={49} strokeWidth={1} /></div><div><p className="eyebrow">{t('صفحة اليوم', 'TODAY’S PAGE')}</p><h2>{date(`${state.local_day}T12:00:00Z`, {timeZone:'UTC', weekday: 'long', day:'numeric', month:'long'})}</h2><p>{t('يُحسب يومك حسب منطقتك الزمنية', 'Your day follows your timezone')} · <b dir="ltr">{state.profile.timezone}</b></p></div><div className="prayer-day-count"><strong>{number(completed)}<small> / {number(5)}</small></strong><span>{t('مسجلة كمكتملة', 'logged complete')}</span></div></section>
    {message && <Notice tone={message.error ? 'danger' : 'success'}>{message.text}</Notice>}
    <div className="prayers-list">{prayers.map(({key, name, reward, icon: Icon}) => { const status = today.find(entry => entry.prayer === key)?.status || 'pending'; return <article className={`panel prayer-row prayer-state-${status}`} key={key}><span className="prayer-row-icon"><Icon size={28} strokeWidth={1.4} /></span><div className="prayer-row-title"><h2>{name}</h2><span className={`prayer-status status-${status}`}>{status === 'completed' && <Check size={14} />}{statusName(status)}</span></div><span className="prayer-reward"><Coins size={17} />+{number(reward)}<small>{t('عند الأداء', 'when completed')}</small></span><Button variant={status === 'pending' ? 'primary' : 'secondary'} disabled={!online || busy} onClick={() => setSelection({prayer:key, day:state.local_day, name, status})}>{status === 'pending' ? <PencilLine size={17} /> : <History size={17} />}{status === 'pending' ? t('سجّل حالتها', 'Record status') : t('مراجعة وتصحيح', 'Review & correct')}</Button></article>; })}</div>
    <Notice title={t('أنت صاحب السجل', 'Your journal, your choice')}>{t('عدم التسجيل لا يخصم شيئًا. «بعذر» لا يخصم شيئًا. اختيار «فاتتني» يحتاج تأكيدًا صريحًا ويخصم ١٠٠ عملة مرة واحدة؛ وقد يصبح الرصيد سالبًا. التصحيح ينشئ تسوية موثقة.', 'Leaving a prayer unlogged deducts nothing. Excused deducts nothing. Choosing “missed” requires explicit confirmation and deducts 100 coins once; your balance may become negative. Corrections create an auditable adjustment.')} <Link className="text-link" to="/stats">{t('راجع تغيّرات الرصيد في السجل', 'Review balance changes in your ledger')}</Link></Notice>
    <section className="panel prayer-history"><button className="history-toggle" onClick={() => setHistory(!history)} aria-expanded={history}><span><History size={21} /><b>{t('مراجعة الأيام السابقة', 'Review previous days')}</b></span><ChevronDown size={20} className={history ? 'rotate' : ''} /></button>{history && <div className="prayer-history-content">{historyDays.length === 0 ? <p className="muted">{t('يبدأ سجلك من أول اختيار تحفظه. لن نفترض حالات الأيام السابقة.', 'Your journal starts with your first saved choice. Previous days are never assumed.')}</p> : historyDays.map(day => <div className="prayer-history-day" key={day}><h3>{date(`${day}T12:00:00Z`, {timeZone:'UTC',weekday:'short',day:'numeric',month:'short'})}</h3><div>{prayers.map(prayer => { const status = state.prayers.find(entry => entry.prayer === prayer.key && entry.day === day)?.status || 'pending'; return <button key={prayer.key} className={`history-prayer status-${status}`} disabled={!online || busy} onClick={() => setSelection({prayer:prayer.key,day,name:prayer.name,status})}><span>{prayer.name}</span><small>{statusName(status)}</small></button>; })}</div></div>)}</div>}</section>
    <Modal open={!!selection} onClose={() => { if (!busy) setSelection(null); }} title={selection ? t('تسجيل صلاة ', 'Record ') + selection.name : ''}>{selection && <div className="form-stack"><p className="muted">{date(`${selection.day}T12:00:00Z`, {timeZone:'UTC',weekday:'long',day:'numeric',month:'long'})} · {t('الحالة الحالية:', 'Current status:')} {statusName(selection.status)}</p><Button disabled={!online || busy || selection.status === 'completed'} loading={busy} onClick={() => void save('completed')}><Check size={18} />{t('أديت الصلاة', 'I completed this prayer')} · +{number(prayers.find(prayer => prayer.key === selection.prayer)?.reward || 20)}</Button><Button variant="secondary" disabled={!online || busy || selection.status === 'excused'} onClick={() => void save('excused')}>{t('بعذر — دون خصم', 'Excused — no deduction')}</Button><Button variant="ghost" disabled={!online || busy || selection.status === 'pending'} onClick={() => void save('pending')}>{t('إعادتها إلى «لم أسجّل بعد»', 'Return to “not logged yet”')}</Button><div className="missed-confirm"><h3>{t('هل فاتتك فعلًا؟', 'Was it actually missed?')}</h3><p>{t('هذا تسجيل اختياري بتأكيدك أنت. سيُخصم ١٠٠ عملة، ويُحفظ سبب التغيير في السجل. يمكنك التصحيح لاحقًا.', 'This is an optional, self-confirmed record. It deducts 100 coins and records the change in your history. You can correct it later.')}</p><Button variant="danger" disabled={!online || busy || selection.status === 'missed'} onClick={() => void save('missed')}>{t('أؤكد: فاتتني — خصم ١٠٠', 'I confirm: missed — deduct 100')}</Button></div>{message?.error && <Notice tone="danger">{message.text}</Notice>}</div>}</Modal>
  </div>;
}
