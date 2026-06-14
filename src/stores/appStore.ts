import type { User } from '@supabase/supabase-js';
import { create } from 'zustand';
import { createId } from '../core/ids';
import { mergeRuleLists } from '../core/ruleListMerge';
import {
  addPlayer,
  drawRule,
  initialGameState,
  nextPlayer,
  normalizeGameState,
  removePlayer,
  reorderPlayers,
  resetGame,
  resetRound,
  selectRuleSet,
  startGame,
} from '../core/gameEngine';
import { cloneRuleSetWithNewIds, downloadRuleSet, parseRuleSetFile } from '../core/ruleSetIO';
import { fetchCatalogList } from '../storage/catalogRuleLists';
import {
  diffRuleSetChanges,
  isGameUsingRuleSet,
  reconcileGameState,
} from '../core/ruleSetReconcile';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  deleteCloudRuleList,
  fetchCloudRuleLists,
  replaceCloudRuleLists,
  upsertCloudRuleList,
} from '../storage/cloudRuleLists';
import {
  clearLocalRuleSets,
  loadLocalRuleSets,
  localStorageAdapter,
  saveGameToLocal,
} from '../storage/localStorage';
import type { AppData, GameState, Player, Rule, RuleSet } from '../types';
import { useAuthStore } from './authStore';
import { useLiveSessionStore } from './liveSessionStore';

interface AppStore {
  ruleSets: RuleSet[];
  game: GameState;
  isHydrated: boolean;
  pendingLocalMerge: RuleSet[] | null;

  hydrate: () => Promise<void>;
  handleAuthChange: (user: User | null) => Promise<void>;
  confirmLocalMerge: (merge: boolean) => Promise<void>;
  dismissLocalMerge: () => void;

  getRuleSet: (id: string) => RuleSet | undefined;
  saveRuleSet: (ruleSet: RuleSet) => Promise<void>;
  deleteRuleSet: (id: string) => Promise<void>;

  addPlayer: (name: string) => void;
  removePlayer: (id: string) => void;
  reorderPlayers: (players: Player[]) => void;
  selectRuleSet: (id: string) => void;
  startGame: () => void;
  drawRule: () =>
    | { ok: true; rule: Rule }
    | { ok: false; reason: 'no_rules' | 'cycle_reset' };
  nextPlayer: () => void;
  resetGame: () => void;
  resetRound: () => void;

  exportRuleSet: (id: string) => void;
  importRuleSet: (file: File) => Promise<RuleSet>;
  duplicateRuleSet: (id: string) => Promise<RuleSet | null>;
  addFromCatalog: (catalogId: string) => Promise<RuleSet | null>;
}

function getActiveUser(): User | null {
  return useAuthStore.getState().user;
}

async function persistGame(game: GameState): Promise<void> {
  await saveGameToLocal(
    game.isActive || game.nextRoundPlayers.length > 0 ? game : null,
  );
}

async function persistGuestRuleSets(ruleSets: RuleSet[], game: GameState): Promise<void> {
  const data: AppData = {
    ruleSets,
    game:
      game.isActive || game.nextRoundPlayers.length > 0 ? game : null,
  };
  await localStorageAdapter.save(data);
}

async function loadRuleSetsForUser(user: User | null): Promise<{
  ruleSets: RuleSet[];
  pendingLocalMerge: RuleSet[] | null;
}> {
  if (!user || !isSupabaseConfigured()) {
    const local = await loadLocalRuleSets();
    return { ruleSets: local, pendingLocalMerge: null };
  }

  const [cloud, local] = await Promise.all([
    fetchCloudRuleLists(user.id),
    loadLocalRuleSets(),
  ]);

  if (local.length > 0) {
    return { ruleSets: cloud, pendingLocalMerge: local };
  }

  return { ruleSets: cloud, pendingLocalMerge: null };
}

export const useAppStore = create<AppStore>((set, get) => ({
  ruleSets: [],
  game: { ...initialGameState },
  isHydrated: false,
  pendingLocalMerge: null,

  async hydrate() {
    const data = await localStorageAdapter.load();
    const user = getActiveUser();
    const { ruleSets, pendingLocalMerge } = await loadRuleSetsForUser(user);

    const game = data.game ? normalizeGameState(data.game) : { ...initialGameState };
    const effectiveRuleSets =
      user && isSupabaseConfigured() ? ruleSets : data.ruleSets;

    set({
      ruleSets: effectiveRuleSets,
      pendingLocalMerge,
      game,
      isHydrated: true,
    });

    useLiveSessionStore.getState().hydrateCredentials();
    if (game.isActive) {
      const ruleSet = effectiveRuleSets.find(
        (rs) => rs.id === game.selectedRuleSetId,
      );
      if (ruleSet) {
        void useLiveSessionStore.getState().ensureSession(ruleSet, game);
      }
    }
  },

  async handleAuthChange(user) {
    const { game } = get();
    const { ruleSets, pendingLocalMerge } = await loadRuleSetsForUser(user);

    if (!user) {
      const local = await loadLocalRuleSets();
      set({ ruleSets: local, pendingLocalMerge: null });
      await persistGuestRuleSets(local, game);
      return;
    }

    set({ ruleSets, pendingLocalMerge });

    if (!pendingLocalMerge) {
      await clearLocalRuleSets();
    }
  },

  async confirmLocalMerge(merge) {
    const user = getActiveUser();
    if (!user || !isSupabaseConfigured()) {
      set({ pendingLocalMerge: null });
      return;
    }

    const { ruleSets, pendingLocalMerge } = get();
    if (!pendingLocalMerge?.length) {
      set({ pendingLocalMerge: null });
      return;
    }

    const next = merge
      ? mergeRuleLists(ruleSets, pendingLocalMerge)
      : ruleSets;

    await replaceCloudRuleLists(user.id, next);
    await clearLocalRuleSets();
    set({ ruleSets: next, pendingLocalMerge: null });
  },

  dismissLocalMerge() {
    void clearLocalRuleSets();
    set({ pendingLocalMerge: null });
  },

  getRuleSet(id) {
    return get().ruleSets.find((rs) => rs.id === id);
  },

  async saveRuleSet(ruleSet) {
    const user = getActiveUser();
    const { ruleSets, game } = get();
    const index = ruleSets.findIndex((rs) => rs.id === ruleSet.id);
    const prev = index >= 0 ? ruleSets[index] : undefined;
    const saved =
      index >= 0 ? ruleSet : { ...ruleSet, id: ruleSet.id || createId() };
    const next =
      index >= 0
        ? ruleSets.map((rs, i) => (i === index ? saved : rs))
        : [...ruleSets, saved];

    let nextGame = game;
    if (prev && isGameUsingRuleSet(game, saved.id)) {
      const diff = diffRuleSetChanges(prev, saved);
      nextGame = reconcileGameState(game, saved, diff);
    }

    set({ ruleSets: next, game: nextGame });

    if (nextGame !== game) {
      await persistGame(nextGame);
    }

    if (user && isSupabaseConfigured()) {
      await upsertCloudRuleList(user.id, saved);
    } else {
      await persistGuestRuleSets(next, nextGame);
    }
  },

  async deleteRuleSet(id) {
    const user = getActiveUser();
    const { ruleSets, game } = get();
    const next = ruleSets.filter((rs) => rs.id !== id);
    set({ ruleSets: next });

    if (user && isSupabaseConfigured()) {
      await deleteCloudRuleList(id);
    } else {
      await persistGuestRuleSets(next, game);
    }
  },

  addPlayer(name) {
    const game = addPlayer(get().game, name);
    set({ game });
    void persistGame(game);
  },

  removePlayer(id) {
    const game = removePlayer(get().game, id);
    set({ game });
    void persistGame(game);
  },

  reorderPlayers(players) {
    const game = reorderPlayers(get().game, players);
    set({ game });
    void persistGame(game);
  },

  selectRuleSet(id) {
    const game = selectRuleSet(get().game, id);
    set({ game });
    void persistGame(game);
  },

  startGame() {
    const { ruleSets } = get();
    const game = startGame(get().game);
    set({ game });
    void persistGame(game);
    useLiveSessionStore.setState({ lastDrawnRule: null, lastDrawnBy: null });

    const ruleSet = ruleSets.find((rs) => rs.id === game.selectedRuleSetId);
    if (ruleSet) {
      void useLiveSessionStore.getState().ensureSession(ruleSet, game);
    }
  },

  drawRule() {
    const { game, ruleSets } = get();
    const ruleSet = ruleSets.find((rs) => rs.id === game.selectedRuleSetId);
    if (!ruleSet) return { ok: false, reason: 'no_rules' as const };

    const drawer = game.currentPlayers[game.currentPlayerIndex];
    const result = drawRule(ruleSet, game);
    if (!result.ok) {
      if (result.state) {
        set({ game: result.state });
        void useLiveSessionStore.getState().pushState(result.state);
      }
      void persistGame(result.state ?? game);
      return result;
    }
    set({ game: result.state });
    void persistGame(result.state);
    void useLiveSessionStore.getState().pushState(result.state, {
      lastDrawnRule: result.rule,
      lastDrawnBy: drawer,
    });
    return { ok: true, rule: result.rule };
  },

  nextPlayer() {
    const game = nextPlayer(get().game);
    set({ game });
    void persistGame(game);
    void useLiveSessionStore.getState().pushState(game);
  },

  resetGame() {
    void useLiveSessionStore.getState().endSession();
    const game = resetGame();
    set({ game });
    void persistGame(game);
  },

  resetRound() {
    const game = resetRound(get().game);
    set({ game });
    void persistGame(game);
    void useLiveSessionStore.getState().pushState(game, { clearLastDrawn: true });
  },


  exportRuleSet(id) {
    const ruleSet = get().ruleSets.find((rs) => rs.id === id);
    if (!ruleSet) return;
    downloadRuleSet(ruleSet);
  },

  async importRuleSet(file) {
    const text = await file.text();
    const ruleSet = parseRuleSetFile(text);
    await get().saveRuleSet(ruleSet);
    return ruleSet;
  },

  async duplicateRuleSet(id) {
    const original = get().ruleSets.find((rs) => rs.id === id);
    if (!original) return null;

    const duplicate = cloneRuleSetWithNewIds({
      ...original,
      name: `${original.name} (copie)`,
    });
    await get().saveRuleSet(duplicate);
    return duplicate;
  },

  async addFromCatalog(catalogId) {
    const entry = await fetchCatalogList(catalogId);
    if (!entry) return null;

    const ruleSet = cloneRuleSetWithNewIds({
      ...entry.payload,
      name: entry.name,
    });
    await get().saveRuleSet(ruleSet);
    return ruleSet;
  },
}));
