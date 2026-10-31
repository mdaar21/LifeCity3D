// @vitest-environment jsdom
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen,waitFor} from '@testing-library/react';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {GameProvider,useAuth,useGame} from '../../src/lib/game';

const mocks=vi.hoisted(()=>({getUser:vi.fn(),getState:vi.fn(),writeRecord:vi.fn(),removeRecord:vi.fn(),removePrefix:vi.fn(),applyProfile:vi.fn()}));
vi.mock('../../src/lib/api',()=>({configuredMode:'supabase',getApi:()=>({mode:'supabase',getUser:mocks.getUser,getState:mocks.getState})}));
vi.mock('../../src/lib/storage',()=>({readRecord:async()=>null,writeRecord:mocks.writeRecord,removeRecord:mocks.removeRecord,removePrefix:mocks.removePrefix}));
vi.mock('../../src/lib/locale',()=>({useLocale:()=>({language:'en',applyProfile:mocks.applyProfile})}));

let client:QueryClient;
function Probe(){const auth=useAuth(),game=useGame();return <output data-testid="identity">{auth.loading?'loading':auth.user?.id??'none'}:{game.mode}</output>;}
beforeEach(()=>{
 vi.clearAllMocks();sessionStorage.setItem('lifecity-guest','true');localStorage.setItem('saved-guest-marker','keep existing city');
 window.history.replaceState(null,'','/dashboard#access_token=invalid-test-token&refresh_token=invalid-test-refresh');
 mocks.getState.mockResolvedValue({});mocks.writeRecord.mockResolvedValue(undefined);mocks.removeRecord.mockResolvedValue(undefined);
 client=new QueryClient({defaultOptions:{queries:{retry:false}}});
});
afterEach(()=>{cleanup();client.clear();sessionStorage.clear();localStorage.clear();window.history.replaceState(null,'','/');});

it('keeps cloud mode across the next reload only after a session is returned, preserving guest data',async()=>{
 mocks.getUser.mockResolvedValue({id:'verified-account',email:'fixture@example.test'});
 render(<QueryClientProvider client={client}><GameProvider><Probe/></GameProvider></QueryClientProvider>);
 await waitFor(()=>expect(screen.getByTestId('identity').textContent).toBe('verified-account:supabase'));
 expect(sessionStorage.getItem('lifecity-guest')).toBeNull();expect(localStorage.getItem('saved-guest-marker')).toBe('keep existing city');
 expect(mocks.removeRecord.mock.calls.some(([key])=>String(key).includes('guest'))).toBe(false);expect(mocks.removePrefix).not.toHaveBeenCalled();
});
it('does not discard the guest preference when a callback does not establish an account session',async()=>{
 mocks.getUser.mockResolvedValue(null);
 render(<QueryClientProvider client={client}><GameProvider><Probe/></GameProvider></QueryClientProvider>);
 await waitFor(()=>expect(screen.getByTestId('identity').textContent).toBe('none:supabase'));
 expect(sessionStorage.getItem('lifecity-guest')).toBe('true');expect(localStorage.getItem('saved-guest-marker')).toBe('keep existing city');
});
