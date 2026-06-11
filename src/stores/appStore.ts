import { create } from 'zustand';
import { createId } from '../core/ids';
import {
  addPlayer,
  drawRule,
  drawSpecialRule,
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
import { downloadRuleSet, parseRuleSetFile } from '../core/ruleSetIO';
import { localStorageAdapter } from '../storage/localStorage';
import type { AppData, GameState, Player, Rule, RuleSet } from '../types';

interface AppStore {
  ruleSets: RuleSet[];
  game: GameState;
  isHydrated: boolean;

  hydrate: () => Promise<void>;
  persist: () => Promise<void>;

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
    | { ok: true; kind: 'special_event' }
    | { ok: false; reason: 'no_rules' | 'cycle_reset' };
  drawSpecialRule: () => { ok: true; rule: Rule } | { ok: false };
  nextPlayer: () => void;
  resetGame: () => void;
  resetRound: () => void;

  exportRuleSet: (id: string) => void;
  importRuleSet: (file: File) => Promise<RuleSet>;
}

async function saveAll(ruleSets: RuleSet[], game: GameState) {
  const data: AppData = {
    ruleSets,
    game:
      game.isActive || game.nextRoundPlayers.length > 0 ? game : null,
  };
  await localStorageAdapter.save(data);
}

export const useAppStore = create<AppStore>((set, get) => ({
  ruleSets: [],
  game: { ...initialGameState },
  isHydrated: false,

  async hydrate() {
    const data = await localStorageAdapter.load();
    set({
      ruleSets: data.ruleSets,
      game: data.game ? normalizeGameState(data.game) : { ...initialGameState },
      isHydrated: true,
    });
  },

  async persist() {
    const { ruleSets, game } = get();
    await saveAll(ruleSets, game);
  },

  getRuleSet(id) {
    return get().ruleSets.find((rs) => rs.id === id);
  },

  async saveRuleSet(ruleSet) {
    const { ruleSets } = get();
    const index = ruleSets.findIndex((rs) => rs.id === ruleSet.id);
    const next =
      index >= 0
        ? ruleSets.map((rs, i) => (i === index ? ruleSet : rs))
        : [...ruleSets, { ...ruleSet, id: ruleSet.id || createId() }];
    set({ ruleSets: next });
    await get().persist();
  },

  async deleteRuleSet(id) {
    const next = get().ruleSets.filter((rs) => rs.id !== id);
    set({ ruleSets: next });
    await get().persist();
  },

  addPlayer(name) {
    const game = addPlayer(get().game, name);
    set({ game });
    void get().persist();
  },

  removePlayer(id) {
    const game = removePlayer(get().game, id);
    set({ game });
    void get().persist();
  },

  reorderPlayers(players) {
    const game = reorderPlayers(get().game, players);
    set({ game });
    void get().persist();
  },

  selectRuleSet(id) {
    const game = selectRuleSet(get().game, id);
    set({ game });
    void get().persist();
  },

  startGame() {
    const game = startGame(get().game);
    set({ game });
    void get().persist();
  },

  drawRule() {
    const { game, ruleSets } = get();
    const ruleSet = ruleSets.find((rs) => rs.id === game.selectedRuleSetId);
    if (!ruleSet) return { ok: false, reason: 'no_rules' as const };

    const result = drawRule(ruleSet, game);
    if (!result.ok) {
      if (result.state) set({ game: result.state });
      void get().persist();
      return result;
    }
    set({ game: result.state });
    void get().persist();
    if ('kind' in result) {
      return { ok: true, kind: 'special_event' as const };
    }
    return { ok: true, rule: result.rule };
  },

  drawSpecialRule() {
    const { game, ruleSets } = get();
    const ruleSet = ruleSets.find((rs) => rs.id === game.selectedRuleSetId);
    if (!ruleSet) return { ok: false };
    const result = drawSpecialRule(ruleSet, game);
    if (!result.ok) return result;
    set({ game: result.state });
    void get().persist();
    return { ok: true, rule: result.rule };
  },

  nextPlayer() {
    const game = nextPlayer(get().game);
    set({ game });
    void get().persist();
  },

  resetGame() {
    set({ game: resetGame() });
    void get().persist();
  },

  resetRound() {
    const game = resetRound(get().game);
    set({ game });
    void get().persist();
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
}));
