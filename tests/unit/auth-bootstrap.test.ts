import {describe,expect,it} from 'vitest';
import {initialAuthMode} from '../../src/lib/auth-bootstrap';
const base='https://mdaar21.github.io/LifeCity3D/';

describe('cloud email callbacks after a separate guest visit',()=>{
 it('loads the account adapter for confirmation and recovery without trusting tokens as identity',()=>{
  for(const path of ['dashboard','reset-password'])expect(initialAuthMode('supabase',base+path+'#access_token=invalid-test-token&refresh_token=invalid-test-refresh&type=recovery',true)).toBe('supabase');
  expect(initialAuthMode('supabase',base+'dashboard?code=invalid-test-code',true)).toBe('supabase');
 });
 it('retains guest mode on ordinary visits and incomplete callback fragments',()=>{
  for(const path of ['city','login','reset-password','dashboard#access_token=invalid-test-token'])expect(initialAuthMode('supabase',base+path,true)).toBe('demo');
  expect(initialAuthMode('supabase',base+'login',false)).toBe('supabase');
 });
 it('does not activate a cloud adapter in local or unconfigured builds',()=>{
  const callback=base+'dashboard#access_token=invalid-test-token&refresh_token=invalid-test-refresh';
  expect(initialAuthMode('demo',callback,false)).toBe('demo');
  expect(initialAuthMode('local',callback,false)).toBe('local');
  expect(initialAuthMode('local',callback,true)).toBe('demo');
 });
});
