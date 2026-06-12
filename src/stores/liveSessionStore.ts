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
import type { GameState, Player, Rule, RuleSet } from '../types';
import type { LiveSessionCredentials } from '../types/liveSession';

interface LiveSessionHostStore {
  credentials: LiveSessionCredentials | null;
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

export const useLiveSessionStore = create<LiveSessionHostStore>((set, get) => ({
  credentials: null,
  isSyncing: false,
  sessionError: null,

  hydrateCredentials() {
    set({ credentials: loadCredentials(), sessionError: null });
  },

  async ensureSession(ruleSet, game) {
    if (!isSupabaseConfigured() || !game.isActive) return;

    const existing = get().credentials ?? loadCredentials();
    if (existing) {
      set({ credentials: existing, isSyncing: true, sessionError: null });
      try {
        await syncGameSession(existing, game);
        set({ isSyncing: false });
        return;
      } catch {
        persistCredentials(null);
        set({ credentials: null });
      }
    }

    set({ isSyncing: true, sessionError: null });
    try {
      const credentials = await createAndPersistSession(ruleSet, game);
      set({ credentials, isSyncing: false, sessionError: null });
    } catch {
      set({
        isSyncing: false,
        sessionError:
          'Impossible de créer la session live. Vérifiez votre connexion.',
      });
    }
  },

  async pushState(game, options) {
    if (!isSupabaseConfigured() || !game.isActive) return;

    const credentials = get().credentials ?? loadCredentials();
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
    const credentials = get().credentials ?? loadCredentials();
    if (credentials && isSupabaseConfigured()) {
      try {
        await endGameSession(credentials);
      } catch {
        // Session peut déjà être expirée ou invalide.
      }
    }
    persistCredentials(null);
    set({ credentials: null });
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
