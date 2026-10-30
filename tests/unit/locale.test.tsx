// @vitest-environment jsdom
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {LocaleProvider,useLocale} from '../../src/lib/locale';
function Probe(){const l=useLocale();return <><span data-testid="copy">{l.t('مرحبًا','Hello')}</span><span data-testid="number">{l.number(123)}</span><span data-testid="date">{l.date('2026-10-30T10:00:00Z',{dateStyle:'short',timeStyle:'short'})}</span><span data-testid="weekday">{l.date('2026-10-30T10:00:00Z',{weekday:'short'})}</span><button onClick={()=>l.setLanguage('en')}>English</button><button onClick={()=>l.applyProfile({id:'test',display_name:'Test',language:'ar-SA',timezone:'Asia/Riyadh',theme:'light',digits:'local',currency_label:'coins'})}>Local digits</button></>;}
beforeEach(()=>{localStorage.clear();vi.stubGlobal('matchMedia',()=>({matches:false}));});afterEach(()=>{cleanup();vi.unstubAllGlobals();});
describe('first-class Arabic locale',()=>{
 it('defaults to Arabic RTL and switches all helper output to English LTR',()=>{render(<LocaleProvider><Probe/></LocaleProvider>);expect(screen.getByTestId('copy').textContent).toBe('مرحبًا');expect(document.documentElement.dir).toBe('rtl');fireEvent.click(screen.getByText('English'));expect(screen.getByTestId('copy').textContent).toBe('Hello');expect(document.documentElement.lang).toBe('en');expect(document.documentElement.dir).toBe('ltr');});
 it('uses profile digits and supports explicit dateStyle/timeStyle without raw ISO fallback',()=>{render(<LocaleProvider><Probe/></LocaleProvider>);fireEvent.click(screen.getByText('Local digits'));expect(screen.getByTestId('number').textContent).toBe('١٢٣');expect(screen.getByTestId('date').textContent).not.toContain('2026-10-30T');});
 it('keeps explicitly requested weekday labels compact for chart axes',()=>{render(<LocaleProvider><Probe/></LocaleProvider>);fireEvent.click(screen.getByText('English'));expect(screen.getByTestId('weekday').textContent).toBe('Fri');});
});
