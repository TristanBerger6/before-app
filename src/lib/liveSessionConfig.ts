export const LIVE_SESSION_STORAGE_KEY = 'before_live_session';

/** Délai sans heartbeat hôte avant affichage « partie déconnectée ». */
export const HOST_STALE_MS = 30_000;

/** Intervalle de heartbeat côté hôte. */
export const HOST_HEARTBEAT_MS = 15_000;

export function buildWatchUrl(code: string): string {
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  return `${base}/watch/${code}`;
}
