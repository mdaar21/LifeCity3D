import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, Building2, Check, Eye, EyeOff, KeyRound, Leaf, Mail, ShieldCheck } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, useGame } from '../lib/game';
import { useLocale } from '../lib/locale';
import { Button, Notice } from '../components/Common';

export default function Auth() {
  const auth = useAuth();
  const { mode: gameMode } = useGame();
  const { t, language, setLanguage } = useLocale();
  const navigate = useNavigate();
  const location = useLocation();
  const updating = location.pathname === '/reset-password';
  const from = (location.state as {from?: unknown} | null)?.from;
  const returnPath = typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') && !from.startsWith('/\\') ? from : '/city';
  const [view, setView] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{text: string; error: boolean} | null>(null);
  useEffect(() => { if (auth.user && gameMode !== 'demo' && !updating) void navigate(returnPath, {replace: true}); }, [auth.user, gameMode, navigate, updating, returnPath]);
  async function submit(event: FormEvent) {
    event.preventDefault(); if (busy) return; setBusy(true); setMessage(null);
    try {
      if (updating) { await auth.updatePassword(password); setMessage({text: t('حُدّثت كلمة المرور. يمكنك الدخول بكلمتك الجديدة.', 'Password updated. You can now sign in with your new password.'), error: false}); }
      else if (view === 'signin') { await auth.signIn(email.trim(), password); void navigate(returnPath, {replace:true}); }
      else if (view === 'signup') { const result = await auth.signUp(email.trim(), password, name.trim()); if (result.confirmation_required) setMessage({text: t('راجع بريدك لتأكيد الحساب، ثم عُد لتسجيل الدخول.', 'Check your email to confirm your account, then return to sign in.'), error:false}); else if (result.user) void navigate(returnPath, {replace:true}); }
      else { await auth.resetPassword(email.trim()); setMessage({text: auth.mode === 'local' ? t('خدمة التطوير المحلية لا ترسل بريدًا حقيقيًا. استخدم رابط الاسترداد الذي تعرضه الخدمة المحلية إن كان متاحًا.', 'The local development service does not send real email. Use the recovery link exposed by the local service if available.') : t('إذا كان البريد مرتبطًا بحساب، ستصلك تعليمات استعادة كلمة المرور.', 'If the address belongs to an account, you will receive password recovery instructions.'), error:false}); }
    } catch { setMessage({text: t('تعذّر إتمام الطلب. تحقق من البيانات والاتصال وإعدادات خدمة الحسابات ثم حاول مجددًا.', 'The request could not be completed. Check your details, connection, and account service configuration, then try again.'), error:true}); }
    finally { setBusy(false); }
  }
  async function demo() {
    if (busy) return;
    setBusy(true); setMessage(null);
    try { await auth.enterDemo(); void navigate(returnPath, {replace:true}); }
    catch { setMessage({text:t('تعذّر فتح التجربة المحلية. تحقق من إتاحة التخزين في المتصفح وحاول مجددًا.', 'The local demo could not open. Check that browser storage is available and try again.'),error:true}); }
    finally { setBusy(false); }
  }
  function switchView(next: typeof view) { setView(next); setMessage(null); }
  const Arrow = language === 'ar-SA' ? ArrowRight : ArrowLeft;
  return <main className="auth-page"><section className="auth-story"><Link className="brand" to="/"><span className="brand-mark"><Building2 size={27} /></span><span><strong>{t('لايف سيتي', 'LifeCity')}<small>3D</small></strong><em>{t('ابنِ مدينتك بإنجازاتك', 'Build your city. Live your progress.')}</em></span></Link><div className="auth-story-copy"><span className="auth-leaf"><Leaf size={42} strokeWidth={1.2} /></span><h1>{t('مكان صغير،', 'A little place,')}<br /><em>{t('لأحلام تكبر.', 'for bigger possibilities.')}</em></h1><p>{t('حوّل خطواتك اليومية إلى عالم يشبهك. بيتًا، شجرة، ووقتًا أجمل لك.', 'Turn your everyday steps into a world of your own. A home, a tree, and more room for you.')}</p><div className="auth-story-line" /><span className="auth-story-caption">{t('خطوة منك. حياة في مدينتك.', 'A step in your day. A little life in your city.')}</span></div><p className="auth-story-bottom">LifeCity 3D <span>✦</span> {t('صُممت لتنمو معك', 'Made to grow with you')}</p></section>
    <section className="auth-form-side"><div className="auth-top-links"><Link to="/"><Arrow size={17} />{t('العودة للرئيسية', 'Back home')}</Link><button onClick={() => setLanguage(language === 'ar-SA' ? 'en' : 'ar-SA')}>{language === 'ar-SA' ? 'English' : 'العربية'}</button></div><div className="auth-form-wrap"><span className="stat-icon moss">{updating || view === 'reset' ? <KeyRound size={25} /> : <Leaf size={25} />}</span><p className="eyebrow">{updating ? t('بداية آمنة', 'A SECURE FRESH START') : view === 'signup' ? t('بداية حكايتك', 'YOUR STORY STARTS HERE') : t('أهلًا بعودتك', 'WELCOME BACK')}</p><h2>{updating ? t('كلمة مرور جديدة', 'A new password') : view === 'signup' ? t('مدينتك تنتظرك.', 'Your city is waiting.') : view === 'reset' ? t('لنستعد حسابك.', 'Let’s recover your account.') : t('لنُكمل ما بدأناه.', 'Let’s keep growing.')}</h2><p className="muted">{updating ? t('اختر كلمة قوية لا تستخدمها في مكان آخر.', 'Choose a strong password you do not use elsewhere.') : view === 'reset' ? t('أدخل بريدك لطلب رابط آمن لاستعادة الحساب.', 'Enter your email to request a secure recovery link.') : t('مساحة هادئة لتقدّم حقيقي، كل يوم.', 'A peaceful space for real progress, every day.')}</p>
      {auth.mode === 'local' && <Notice>{t('أنت تستخدم خدمة تطوير محلية. الحسابات والحفظ على هذا الخادم المحلي، ولا يوجد إرسال بريد حقيقي.', 'You are using a local development service. Accounts and saves live on this local server; real email is not delivered.')}</Notice>}
      {auth.mode === 'demo' && <Notice tone="warning">{t('خدمة الحسابات غير مهيأة حاليًا. يمكنك استكشاف التجربة المحلية؛ بياناتها لا تنتقل إلى حساب سحابي.', 'The account service is not configured. You can explore the local demo; its data does not transfer to a cloud account.')}</Notice>}
      {!updating && view !== 'reset' && <div className="auth-tabs" role="group" aria-label={t('نوع الدخول', 'Access type')}><button className={view === 'signin' ? 'active' : ''} onClick={() => switchView('signin')} aria-pressed={view === 'signin'}>{t('تسجيل الدخول', 'Sign in')}</button><button className={view === 'signup' ? 'active' : ''} onClick={() => switchView('signup')} aria-pressed={view === 'signup'}>{t('حساب جديد', 'Create account')}</button></div>}
      <form className="form-stack" onSubmit={event => void submit(event)}>{!updating && view === 'signup' && <label className="field"><span>{t('بماذا نناديك؟', 'What should we call you?')}</span><input className="input" required minLength={2} maxLength={50} autoComplete="nickname" data-testid="auth-name" value={name} onChange={event => setName(event.target.value)} placeholder={t('اسمك الجميل', 'Your name')} /></label>}{!updating && <label className="field"><span>{t('البريد الإلكتروني', 'Email address')}</span><div className="input-with-icon"><Mail size={18} /><input className="input" type="email" required autoComplete="email" data-testid="auth-email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" dir="ltr" /></div></label>}{(updating || view !== 'reset') && <label className="field"><span>{t('كلمة المرور', 'Password')}</span><div className="password-input"><input className="input" type={show ? 'text' : 'password'} required minLength={10} maxLength={128} autoComplete={updating || view === 'signup' ? 'new-password' : 'current-password'} data-testid="auth-password" value={password} onChange={event => setPassword(event.target.value)} placeholder={t('١٠ أحرف على الأقل', 'At least 10 characters')} /><button type="button" className="icon-button" aria-label={show ? t('إخفاء كلمة المرور', 'Hide password') : t('إظهار كلمة المرور', 'Show password')} onClick={() => setShow(!show)}>{show ? <EyeOff size={19} /> : <Eye size={19} />}</button></div></label>}{view === 'signin' && !updating && <button className="forgot-password" type="button" onClick={() => switchView('reset')}>{t('نسيت كلمة المرور؟', 'Forgot your password?')}</button>}{message && <Notice tone={message.error ? 'danger' : 'success'}>{message.text}</Notice>}<Button type="submit" data-testid="auth-submit" loading={busy} disabled={busy || auth.mode === 'demo'}>{updating ? t('حفظ كلمة المرور', 'Save new password') : view === 'signup' ? t('لنبدأ حكاية مدينتك', 'Start your city’s story') : view === 'reset' ? t('إرسال طلب الاستعادة', 'Send recovery request') : t('دخول إلى مدينتي', 'Enter my city')}<Check size={18} /></Button></form>{view === 'reset' && !updating && <Button variant="ghost" onClick={() => switchView('signin')}>{t('العودة لتسجيل الدخول', 'Back to sign in')}</Button>}{updating && <Link to="/login" className="text-link">{t('الذهاب لتسجيل الدخول', 'Go to sign in')}</Link>}<div className="auth-divider"><span />{t('أو خذ جولة أولًا', 'or take a look around')}<span /></div><Button variant="secondary" disabled={busy} onClick={() => void demo()}>{t('استكشف التجربة المحلية', 'Explore the local demo')}</Button><p className="auth-privacy"><ShieldCheck size={16} />{t('بياناتك لك. التجربة المحلية منفصلة عن حسابك.', 'Your data belongs to you. The local demo is separate from your account.')}</p></div></section>
  </main>;
}
