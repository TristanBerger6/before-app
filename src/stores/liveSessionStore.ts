import { create } from 'zustand';
import {
  HOST_HEARTBEAT_MS,
  LIVE_SESSION_STORAGE_KEY,
} from '../lib/liveSessionConfig';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  createGameSession,
  endGameSession,
  syncGameSession,
} from '../storage/gameSessions';
import { watchSpectatorPresence } from '../storage/gameSessionPresence';
import type { GameState, Player, Rule, RuleSet } from '../types';
import type { LiveSessionCredentials } from '../types/liveSession';

interface LiveSessionHostStore {
  credentials: LiveSessionCredentials | null;
  lastDrawnRule: Rule | null;
  lastDrawnBy: Player | null;
  viewerCount: number;
  isSyncing: boolean;
  sessionError: string | null;

  hydrateCredentials: () => void;
  ensureSession: (ruleSet: RuleSet, game: GameState) => Promise<void>;
  pushState: (
    game: GameState,
    options?: {
      lastDrawnRule?: Rule;
      lastDrawnBy?: Player;
      clearLastDrawn?: boolean;
    },
  ) => Promise<void>;
  endSession: () => Promise<void>;
  startHeartbeat: (getGame: () => GameState) => void;
  stopHeartbeat: () => void;
}

let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let stopPresenceWatch: (() => void) | null = null;
let presenceSessionId: string | null = null;
let ensureSessionInFlight: Promise<void> | null = null;

function startPresenceWatch(
  sessionId: string,
  onCount: (count: number) => void,
): void {
  if (presenceSessionId === sessionId && stopPresenceWatch) return;

  if (stopPresenceWatch) {
    stopPresenceWatch();
    stopPresenceWatch = null;
  }

  presenceSessionId = sessionId;
  stopPresenceWatch = watchSpectatorPresence(sessionId, onCount);
}

function clearPresenceWatch(): void {
  if (stopPresenceWatch) {
    stopPresenceWatch();
    stopPresenceWatch = null;
  }
  presenceSessionId = null;
}

function persistCredentials(credentials: LiveSessionCredentials | null): void {
  if (!credentials) {
    localStorage.removeItem(LIVE_SESSION_STORAGE_KEY);
    return;
  }
  localStorage.setItem(LIVE_SESSION_STORAGE_KEY, JSON.stringify(credentials));
}

function loadCredentials(): LiveSessionCredentials | null {
  try {
    const raw = localStorage.getItem(LIVE_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LiveSessionCredentials;
    if (!parsed?.id || !parsed?.code || !parsed?.hostToken) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function createAndPersistSession(
  ruleSet: RuleSet,
  game: GameState,
): Promise<LiveSessionCredentials> {
  const credentials = await createGameSession(ruleSet, game);
  persistCredentials(credentials);
  return credentials;
}

function getCredentials(
  get: () => LiveSessionHostStore,
): LiveSessionCredentials | null {
  return get().credentials ?? loadCredentials();
}

export const useLiveSessionStore = create<LiveSessionHostStore>((set, get) => ({
  credentials: null,
  lastDrawnRule: null,
  lastDrawnBy: null,
  viewerCount: 0,
  isSyncing: false,
  sessionError: null,

  hydrateCredentials() {
    set({ credentials: loadCredentials(), sessionError: null });
  },

  async ensureSession(ruleSet, game) {
    if (!isSupabaseConfigured() || !game.isActive) return;

    if (ensureSessionInFlight) {
      return ensureSessionInFlight;
    }

    ensureSessionInFlight = (async () => {
      const existing = getCredentials(get);
      if (existing) {
        set({ credentials: existing, isSyncing: true, sessionError: null });
        try {
          await syncGameSession(existing, game);
          startPresenceWatch(existing.id, (count) => set({ viewerCount: count }));
          set({ isSyncing: false });
          return;
        } catch {
          persistCredentials(null);
          clearPresenceWatch();
          set({ credentials: null, viewerCount: 0 });
        }
      }

      set({ isSyncing: true, sessionError: null });
      try {
        const credentials = await createAndPersistSession(ruleSet, game);
        startPresenceWatch(credentials.id, (count) => set({ viewerCount: count }));
        set({ credentials, isSyncing: false, sessionError: null });
      } catch {
        set({
          isSyncing: false,
          sessionError:
            'Impossible de créer la session live. Vérifiez votre connexion.',
        });
      }
    })().finally(() => {
      ensureSessionInFlight = null;
    });

    return ensureSessionInFlight;
  },

  async pushState(game, options) {
    if (options?.clearLastDrawn) {
      set({ lastDrawnRule: null, lastDrawnBy: null });
    } else if (options?.lastDrawnRule) {
      set({
        lastDrawnRule: options.lastDrawnRule,
        lastDrawnBy: options.lastDrawnBy ?? null,
      });
    }

    if (!isSupabaseConfigured() || !game.isActive) return;

    const credentials = getCredentials(get);
    if (!credentials) return;

    set({ isSyncing: true });
    try {
      await syncGameSession(credentials, game, {
        lastDrawnRule: options?.lastDrawnRule,
        lastDrawnBy: options?.lastDrawnBy,
        clearLastDrawn: options?.clearLastDrawn,
      });
      set({ credentials, isSyncing: false });
    } catch {
      set({ isSyncing: false });
    }
  },

  async endSession() {
    get().stopHeartbeat();
    const credentials = getCredentials(get);
    if (credentials && isSupabaseConfigured()) {
      try {
        await endGameSession(credentials);
      } catch {
        // Session peut déjà être expirée ou invalide.
      }
    }
    clearPresenceWatch();
    persistCredentials(null);
    set({
      credentials: null,
      lastDrawnRule: null,
      lastDrawnBy: null,
      viewerCount: 0,
    });
  },

  startHeartbeat(getGame) {
    if (heartbeatTimer) return;
    heartbeatTimer = setInterval(() => {
      const game = getGame();
      if (!game.isActive) return;
      void get().pushState(game);
    }, HOST_HEARTBEAT_MS);
  },

  stopHeartbeat() {
    if (!heartbeatTimer) return;
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  },
}));
