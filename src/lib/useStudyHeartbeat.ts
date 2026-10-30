import { useEffect, useRef } from 'react';
import { useGame } from './game';

/** One heartbeat owner for the entire play session, independent of open menus. */
export function useStudyHeartbeat() {
  const { state, online, mutate } = useGame();
  const current = useRef(mutate);
  current.current = mutate;
  const session = state?.study_sessions.find(item => item.status !== 'finished');
  const id = session?.id;
  const status = session?.status;
  useEffect(() => {
    if (!id || status !== 'running' || !online) return;
    let inFlight = false;
    const timer = window.setInterval(() => {
      if (inFlight) return;
      inFlight = true;
      // mutate retains the idempotency key on uncertain delivery and surfaces
      // errors through the shared save indicator. Never credit client time.
      void current.current('study_heartbeat', {session_id:id})
        .catch(() => {})
        .finally(() => { inFlight = false; });
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [id, status, online]);
}
