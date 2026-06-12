import { create } from 'zustand';
import { HOST_STALE_MS } from '../lib/liveSessionConfig';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  fetchGameSessionByCode,
  subscribeGameSession,
} from '../storage/gameSessions';
import type {
  LiveSessionSnapshot,
  SpectatorConnectionStatus,
} from '../types/liveSession';

interface SpectatorStore {
  code: string | null;
  snapshot: LiveSessionSnapshot | null;
  connectionStatus: SpectatorConnectionStatus;
  error: string | null;

  join: (code: string) => Promise<boolean>;
  leave: () => void;
}

let unsubscribeRealtime: (() => void) | null = null;
let staleCheckTimer: ReturnType<typeof setInterval> | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;

function deriveStatus(
  snapshot: LiveSessionSnapshot | null,
): SpectatorConnectionStatus {
  if (!snapshot) return 'idle';
  if (snapshot.status === 'ended') return 'ended';

  const seenAt = new Date(snapshot.hostSeenAt).getTime();
  if (Number.isNaN(seenAt) || Date.now() - seenAt > HOST_STALE_MS) {
    return 'disconnected';
  }

  return snapshot.status === 'disconnected' ? 'disconnected' : 'live';
}

function clearTimers() {
  if (unsubscribeRealtime) {
    unsubscribeRealtime();
    unsubscribeRealtime = null;
  }
  if (staleCheckTimer) {
    clearInterval(staleCheckTimer);
    staleCheckTimer = null;
  }
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

function applySnapshot(
  set: (partial: Partial<SpectatorStore>) => void,
  snapshot: LiveSessionSnapshot,
) {
  set({
    snapshot,
    connectionStatus: deriveStatus(snapshot),
    error: null,
  });
}

function startPolling(
  code: string,
  set: (partial: Partial<SpectatorStore>) => void,
) {
  if (pollTimer) return;

  pollTimer = setInterval(() => {
    void (async () => {
      try {
        const snapshot = await fetchGameSessionByCode(code);
        if (!snapshot) return;
        applySnapshot(set, snapshot);
      } catch {
        // Polling silencieux — Realtime reste la source principale.
      }
    })();
  }, 10_000);
}

export const useSpectatorStore = create<SpectatorStore>((set, get) => ({
  code: null,
  snapshot: null,
  connectionStatus: 'idle',
  error: null,

  async join(code) {
    const normalized = code.trim().toUpperCase();
    if (!normalized) {
      set({ error: 'Entrez un code de partie.' });
      return false;
    }

    if (!isSupabaseConfigured()) {
      set({
        error: 'Le mode spectateur nécessite une connexion au serveur.',
        connectionStatus: 'idle',
      });
      return false;
    }

    const { code: activeCode, snapshot } = get();
    if (activeCode === normalized && snapshot) {
      return true;
    }

    clearTimers();
    set({ code: normalized, connectionStatus: 'loading', error: null });

    try {
      const fetched = await fetchGameSessionByCode(normalized);
      if (!fetched) {
        set({
          snapshot: null,
          connectionStatus: 'idle',
          error: 'Code invalide ou partie introuvable.',
        });
        return false;
      }

      applySnapshot(set, fetched);

      try {
        unsubscribeRealtime = subscribeGameSession(
          fetched.id,
          (next) => applySnapshot(set, next),
          () => get().snapshot,
        );
      } catch {
        // Realtime indisponible : le polling prend le relais.
      }

      staleCheckTimer = setInterval(() => {
        const current = get().snapshot;
        if (!current) return;
        set({ connectionStatus: deriveStatus(current) });
      }, 5_000);

      startPolling(normalized, set);

      return true;
    } catch (err) {
      console.error('[spectator] join failed', err);
      set({
        snapshot: null,
        connectionStatus: 'idle',
        error: 'Impossible de rejoindre la partie.',
      });
      return false;
    }
  },

  leave() {
    clearTimers();
    set({
      code: null,
      snapshot: null,
      connectionStatus: 'idle',
      error: null,
    });
  },
}));
