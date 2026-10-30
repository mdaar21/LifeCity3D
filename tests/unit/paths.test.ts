import {describe,expect,it} from 'vitest';
import {appPath} from '../../src/lib/paths';
describe('hosting paths',()=>{
 it('normalizes leading slashes without escaping the configured app base',()=>{expect(appPath('icons/icon.svg')).toBe('/icons/icon.svg');expect(appPath('/reset-password')).toBe('/reset-password');});
});
