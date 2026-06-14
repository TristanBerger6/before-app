import { useEffect } from 'react';
import { useAppStore } from '../../stores/appStore';
import { useLiveSessionStore } from '../../stores/liveSessionStore';

/** Maintient la session live et le heartbeat tant qu'une partie est active (toutes routes). */
export function LiveSessionHostSync() {
  const isActive = useAppStore((s) => s.game.isActive);
  const selectedRuleSetId = useAppStore((s) => s.game.selectedRuleSetId);
  const ensureSession = useLiveSessionStore((s) => s.ensureSession);
  const startHeartbeat = useLiveSessionStore((s) => s.startHeartbeat);
  const stopHeartbeat = useLiveSessionStore((s) => s.stopHeartbeat);

  useEffect(() => {
    if (!isActive) {
      stopHeartbeat();
      return;
    }

    const { game, ruleSets } = useAppStore.getState();
    const ruleSet = ruleSets.find((rs) => rs.id === game.selectedRuleSetId);
    if (ruleSet) {
      void ensureSession(ruleSet, game);
    }
    startHeartbeat(() => useAppStore.getState().game);

    return () => stopHeartbeat();
  }, [
    isActive,
    selectedRuleSetId,
    ensureSession,
    startHeartbeat,
    stopHeartbeat,
  ]);

  return null;
}
