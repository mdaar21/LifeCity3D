import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import FocusGarden from '../../src/components/FocusGarden';
import {LocaleProvider} from '../../src/lib/locale';
import type {StudySession} from '../../src/lib/types';
const session:StudySession={id:'session',status:'running',started_at:'2026-10-30T10:00:00Z',last_tick_at:'2026-10-30T10:00:00Z',active_seconds:0,credited_minutes:0,bonus_awarded:false};
describe('focus plant respects credited server time',()=>{
 it('an hour of estimated display time cannot grow the plant or claim a verified bonus',()=>{const html=renderToStaticMarkup(<LocaleProvider><FocusGarden session={session} projectedSeconds={3600}/></LocaleProvider>);expect(html).toContain('data-growth-stage="0"');expect(html).not.toContain('مكافأة الساعة +٢٠ معتمدة');expect(html).toContain('النبتة تنتظر اعتماد الوقت');});
 it('pause and recovery retain confirmed growth; only a confirmed hour bonus is displayed',()=>{const html=renderToStaticMarkup(<LocaleProvider><FocusGarden session={{...session,status:'paused',credited_minutes:60,active_seconds:3600,bonus_awarded:true,idle_capped:true}}/></LocaleProvider>);expect(html).toContain('data-growth-stage="5"');expect(html).toContain('النمو محفوظ أثناء الاستراحة');expect(html).toContain('مكافأة الساعة +٢٠ معتمدة');expect(html).toContain('الوقت غير المؤكد');});
});
