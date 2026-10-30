// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useStudyHeartbeat } from '../../src/lib/useStudyHeartbeat';

const game = vi.hoisted(() => ({
  online:true,
  state:{study_sessions:[{id:'session-a', status:'running'}]},
  mutate:vi.fn().mockResolvedValue({}),
}));
vi.mock('../../src/lib/game', () => ({useGame:() => game}));
beforeEach(() => {
  vi.useFakeTimers(); game.online=true;
  game.state.study_sessions=[{id:'session-a',status:'running'}];
  game.mutate.mockReset().mockResolvedValue({});
});
afterEach(() => { cleanup(); vi.useRealTimers(); });
describe('session-wide study reconciliation', () => {
  it('keeps the same cadence through menu renders and stops when paused or offline', async () => {
    const {rerender,unmount}=renderHook(() => useStudyHeartbeat());
    await act(async () => { await vi.advanceTimersByTimeAsync(15_000); });
    rerender();
    await act(async () => { await vi.advanceTimersByTimeAsync(15_000); });
    expect(game.mutate).toHaveBeenCalledExactlyOnceWith('study_heartbeat',{session_id:'session-a'});
    game.state.study_sessions[0].status='paused';rerender();
    await act(async () => { await vi.advanceTimersByTimeAsync(60_000); });
    expect(game.mutate).toHaveBeenCalledTimes(1);
    game.state.study_sessions[0].status='running';game.online=false;rerender();
    await act(async () => { await vi.advanceTimersByTimeAsync(60_000); });
    expect(game.mutate).toHaveBeenCalledTimes(1);
    game.online=true;rerender();
    await act(async () => { await vi.advanceTimersByTimeAsync(30_000); });
    expect(game.mutate).toHaveBeenCalledTimes(2);
    unmount();
    await act(async () => { await vi.advanceTimersByTimeAsync(60_000); });
    expect(game.mutate).toHaveBeenCalledTimes(2);
  });
  it('does not overlap slow requests and recovers after rejection', async () => {
    let reject!: (reason:Error) => void;
    game.mutate.mockImplementationOnce(() => new Promise((_resolve,fail) => {reject=fail;}));
    renderHook(() => useStudyHeartbeat());
    await act(async () => { await vi.advanceTimersByTimeAsync(90_000); });
    expect(game.mutate).toHaveBeenCalledTimes(1);
    await act(async () => { reject(new Error('offline')); });
    await act(async () => { await vi.advanceTimersByTimeAsync(30_000); });
    expect(game.mutate).toHaveBeenCalledTimes(2);
    // No amounts or elapsed seconds are ever sent from the displayed clock.
    expect(game.mutate).toHaveBeenLastCalledWith('study_heartbeat',{session_id:'session-a'});
  });
});
