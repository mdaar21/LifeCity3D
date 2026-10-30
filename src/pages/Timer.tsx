import { useEffect, useRef, useState } from 'react';
import { Check, Clock3, Coins, Coffee, Focus, Pause, Play, RotateCcw, Square, Trophy } from 'lucide-react';
import { useGame } from '../lib/game';
import { useLocale } from '../lib/locale';
import type { StudySession } from '../lib/types';
import { Button, LoadingState, Notice, SectionTitle } from '../components/Common';

export default function Timer() {
  const { state, loading, mutate, online } = useGame();
  const { t, number } = useLocale();
  const [now, setNow] = useState(Date.now);
  const [target, setTarget] = useState(25);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [summary, setSummary] = useState<StudySession | null>(null);
  const busyRef = useRef(false);
  const offset = useRef(0);
  const mutateRef = useRef(mutate);
  mutateRef.current = mutate;
  const session = state?.study_sessions.find(item => item.status !== 'finished');
  const sessionId = session?.id;
  const sessionStatus = session?.status;
  useEffect(() => { if (state?.server_now) offset.current = new Date(state.server_now).getTime() - Date.now(); }, [state?.server_now]);
  useEffect(() => { const id = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(id); }, []);
  useEffect(() => {
    if (!sessionId || sessionStatus !== 'running' || !online) return;
    const id = window.setInterval(() => {
      if (busyRef.current) return;
      busyRef.current = true;
      void mutateRef.current('study_heartbeat', {session_id: sessionId}).then(() => setError(false)).catch(() => setError(true)).finally(() => {busyRef.current = false;});
    }, 30000);
    return () => window.clearInterval(id);
  }, [sessionId, sessionStatus, online]);
  async function command(action: string) {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setError(false);
    try {
      const response = await mutate(action, session ? {session_id: session.id} : {});
      if (action === 'study_start') setSummary(null);
      if (action === 'study_finish') setSummary(response.state?.study_sessions.find(item => item.id === session?.id) || null);
    } catch { setError(true); }
    finally { busyRef.current = false; setBusy(false); }
  }
  if (loading || !state) return <LoadingState />;
  const running = session?.status === 'running';
  const sinceTick = session ? Math.max(0, Math.floor((now + offset.current - new Date(session.last_tick_at).getTime()) / 1000)) : 0;
  const elapsed = Math.max(0, (session?.active_seconds || 0) + (running && online ? Math.min(sinceTick, 90) : 0));
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const percentage = Math.min(elapsed / (target * 60), 1);
  const credited = session?.credited_minutes || 0;
  const reward = credited + (session?.bonus_awarded ? 20 : 0);
  const idle = !!session && (session.idle_capped || sinceTick > 90);
  return <div className="page timer-page"><SectionTitle eyebrow={t('عقلك هنا. مدينتك تكبر.', 'BE PRESENT. GROW YOUR CITY.')} title={t('مساحة تركيزك', 'Your space to focus')} description={t('دقيقة واحدة في كل مرة. امنح ما يهمك انتباهك، واترك الباقي لنا.', 'One minute at a time. Give what matters your attention, and let your city grow.')} />
    {error && <Notice tone="danger">{t('تعذّر تأكيد الجلسة مع الخادم. عدّاد العرض ليس مكافأة؛ راجع الاتصال وحاول مرة أخرى.', 'The session could not be confirmed with the server. The displayed timer is not a reward; check your connection and try again.')}</Notice>}
    {idle && <Notice tone="warning">{t('استعدنا جلستك المحفوظة. الوقت غير المؤكد أثناء الغياب يُحدّ على الخادم ولا يُحتسب كاملًا. راجع الدقائق المعتمدة أدناه.', 'Your saved session was recovered. Unverified time away is capped by the server rather than fully credited. Check your verified minutes below.')}</Notice>}
    <div className="timer-layout"><section className="panel focus-studio"><div className="focus-studio-top"><span className={`chip ${running ? 'running-chip' : ''}`}><span className="live-dot" />{running ? t('في لحظة تركيز', 'In focus') : session ? t('استراحة، على مهلك', 'Paused, take your time') : t('بداية هادئة', 'A peaceful beginning')}</span><Focus size={22} strokeWidth={1.5} /></div><div className="timer-targets" role="group" aria-label={t('هدف العرض بالدقائق', 'Visual goal in minutes')}>{[25, 50, 60].map(value => <button className={target === value ? 'active' : ''} key={value} onClick={() => setTarget(value)} aria-pressed={target === value}>{number(value)} {t('دقيقة', 'min')}</button>)}</div><div className={`timer-clock ${running ? 'is-running' : ''}`}><svg viewBox="0 0 300 300" aria-hidden="true"><circle cx="150" cy="150" r="137" className="timer-ring-track" /><circle cx="150" cy="150" r="137" className="timer-ring-progress" strokeDasharray={861} strokeDashoffset={861 * (1 - percentage)} /></svg><div className="timer-clock-content"><span className="timer-clock-eyebrow">{t('وقت الدراسة', 'STUDY TIME')}</span><span className="timer-digits" dir="ltr" aria-live="off">{number(minutes, {minimumIntegerDigits:2,useGrouping:false})}<span>:</span>{number(seconds, {minimumIntegerDigits:2,useGrouping:false})}</span><span className="timer-clock-caption">{running ? t('خذ نفسًا. أنت تتقدّم.', 'Breathe. You are making progress.') : session ? t('الاستراحة جزء من الإنجاز.', 'Rest is part of progress.') : t('هل نبدأ خطوة صغيرة؟', 'Ready for one small step?')}</span></div></div><div className="timer-controls">{!session ? <Button onClick={() => void command('study_start')} disabled={!online || busy} loading={busy}><Play size={19} fill="currentColor" />{t('ابدأ التركيز', 'Start focusing')}</Button> : <><Button onClick={() => void command(running ? 'study_pause' : 'study_resume')} disabled={!online || busy} loading={busy}>{running ? <Pause size={19} fill="currentColor" /> : <Play size={19} fill="currentColor" />}{running ? t('استراحة قصيرة', 'Take a pause') : t('أكمل جلستك', 'Resume session')}</Button><Button variant="secondary" onClick={() => void command('study_finish')} disabled={!online || busy}><Square size={17} />{t('إنهاء الجلسة', 'Finish')}</Button></>}</div><p className="timer-hint"><Clock3 size={14} />{t('الهدف للدعم البصري فقط؛ يمكنك إنهاء الجلسة متى شئت.', 'The goal is a visual guide. Finish whenever you choose.')}</p></section>
    <aside className="timer-sidebar"><div className="panel focus-reward-panel"><span className="stat-icon gold"><Coins size={25} /></span><h2>{t('دقائقك تصنع فرقًا', 'Your minutes make a difference')}</h2><div className="focus-rule"><strong>+{number(1)}</strong><div><b>{t('عملة لكل دقيقة مكتملة', 'coin per complete minute')}</b><small>{t('من وقت الدراسة المعتمد', 'of verified study time')}</small></div></div><div className="focus-rule"><strong>+{number(20)}</strong><div><b>{t('مكافأة الساعة الأولى', 'first-hour milestone')}</b><small>{t('مرة واحدة عند إكمال ٦٠ دقيقة في الجلسة', 'once after 60 complete minutes in a session')}</small></div></div><div className="verified-rewards"><div><span>{t('دقائق معتمدة', 'Verified minutes')}</span><b>{number(credited)}</b></div><div><span>{t('مكافأة الجلسة المعتمدة', 'Verified session reward')}</span><b>+{number(reward)} <Coins size={14} /></b></div><div><span>{t('تقدير الوقت المعروض', 'Displayed time estimate')}</span><b>+{number(minutes + (minutes >= 60 ? 20 : 0))}</b></div></div></div><div className="focus-quiet-card"><Coffee size={26} strokeWidth={1.4} /><h3>{t('أغلق الضجيج، وافتح نافذة.', 'Less noise. More room to think.')}</h3><p>{t('المؤقت يتوقف عند الاستراحة. المكافآت تُثبت على الخادم، دون تكرار عند التحديث أو إعادة الاتصال.', 'The timer pauses when you do. Rewards are verified by the server and cannot repeat on refresh or reconnect.')}</p></div></aside></div>
    {summary && <section className="panel session-summary"><span className="stat-icon moss"><Check size={27} /></span><div><p className="eyebrow">{t('حُفظت جلستك', 'SESSION SAVED')}</p><h2>{t('وقت يستحق الاحتفاء.', 'Time worth celebrating.')}</h2><p>{number(summary.credited_minutes)} {t('دقيقة معتمدة', 'verified minutes')} · <b>+{number(summary.credited_minutes + (summary.bonus_awarded ? 20 : 0))} {t('عملة', 'coins')}</b>{summary.bonus_awarded && <> · <Trophy size={15} /> {t('تشمل مكافأة الساعة +٢٠', 'Includes the +20 hour bonus')}</>}</p>{summary.idle_capped && <small className="muted">{t('حُدّ الوقت غير المؤكد أثناء الغياب.', 'Unverified idle time was capped.')}</small>}</div><Button variant="ghost" onClick={() => setSummary(null)}><RotateCcw size={17} />{t('جلسة جديدة', 'New session')}</Button></section>}
  </div>;
}
