import {Monitor,SlidersHorizontal} from 'lucide-react';
import {Link} from 'react-router-dom';
import {useLocale} from '../lib/locale';
import {useGraphics,useGraphicsProfile} from '../world/useGraphics';
import {useWorldUI} from '../world/useWorldUI';
export function GraphicsSettings(){
 const {t}=useLocale(),preset=useGraphics(s=>s.preset),setPreset=useGraphics(s=>s.setPreset),profile=useGraphicsProfile();
 const choices=[['auto','تلقائي','Auto','حسب الجهاز','Device aware'],['low','خفيف','Low','أقل استهلاك','Lower demand'],['medium','متوازن','Medium','ظلال ناعمة','Soft shadows'],['high','تفاصيل','High','دقة أعلى','Higher detail']] as const;
 return <section className="social-panel graphics-panel" data-testid="graphics-settings"><h2><Monitor size={20}/>{t('رسوم اللعبة على هذا الجهاز','Game graphics on this device')}</h2><p>{t('تُحفظ هنا فقط. تغيّر الدقة والظلال وكثافة المطر؛ لا تغيّر عناصر مدينتك أو تقدمها.','Saved on this device. Adjusts resolution, shadows and rain density; your city items and progress stay intact.')}</p><div className="graphics-options" role="group" aria-label={t('جودة الرسوم','Graphics quality')}>{choices.map(([value,ar,en,hintAr,hintEn])=><button type="button" key={value} data-testid={'graphics-'+value} aria-pressed={preset===value} onClick={()=>setPreset(value)}>{t(ar,en)}<small>{t(hintAr,hintEn)}</small></button>)}</div><p role="status">{t('الوضع الفعلي:','Effective quality:')} {t(profile.level==='low'?'خفيف':profile.level==='medium'?'متوازن':'تفاصيل',profile.level)} · DPR {profile.dpr}</p><Link className="social-button" to="/city" onClick={()=>useWorldUI.getState().set({open:true,tab:'settings',replay:null})}><SlidersHorizontal size={17}/>{t('الطقس والوقت وإعدادات العالم','Weather, time & world settings')}</Link></section>;
}
