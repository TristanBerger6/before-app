import { createId } from './ids';
import { formatPlayerName } from './playerHelpers';
import {
  getRemainingCopies,
  getRuleCopies,
  getPersistentDrawChance,
  getPlayableRules,
  getSpecialTriggerChance,
  isEveryonePersistent,
  isUnlimitedPersistent,
  isSimpleDeckExhausted,
  pickWeightedRule,
} from './ruleHelpers';
import type {
  ActivePersistentRule,
  GameState,
  Player,
  RandomDuration,
  Rule,
  RuleSet,
} from '../types';

export const initialGameState: GameState = {
  currentPlayers: [],
  nextRoundPlayers: [],
  currentPlayerIndex: 0,
  selectedRuleSetId: null,
  activePersistentRules: [],
  rulesToReactivateNextRound: [],
  drawnSimpleRules: [],
  totalTurns: 1,
  isActive: false,
  hasDrawnThisTurn: false,
};

function migrateActiveRule(
  ar: ActivePersistentRule & { remainingTurns?: number; awaitingFirstPass?: boolean },
  playerCount: number,
): ActivePersistentRule {
  const awaitingFirstPass = ar.awaitingFirstPass ?? false;
  if (ar.remainingTours != null) {
    return { ...ar, awaitingFirstPass };
  }
  const legacy = ar.remainingTurns ?? 1;
  const count = Math.max(1, playerCount);
  return {
    ...ar,
    remainingTours: Math.max(1, Math.ceil(legacy / count)),
    awaitingFirstPass,
  };
}

function normalizePlayers(players: Player[]): Player[] {
  return players.map((p) => ({ ...p, name: formatPlayerName(p.name) }));
}

/** Migre les sauvegardes qui utilisaient encore `players` ou `remainingTurns`. */
export function normalizeGameState(
  raw: Partial<GameState> & { players?: Player[] },
): GameState {
  const playerCount =
    raw.currentPlayers?.length ?? raw.players?.length ?? raw.nextRoundPlayers?.length ?? 1;

  const base = { ...initialGameState, ...raw };

  if (raw.players && !raw.currentPlayers?.length && !raw.nextRoundPlayers?.length) {
    return {
      ...base,
      currentPlayers: normalizePlayers(raw.players),
      nextRoundPlayers: normalizePlayers(raw.players),
      activePersistentRules: (raw.activePersistentRules ?? []).map((ar) =>
        migrateActiveRule(ar as ActivePersistentRule & { remainingTurns?: number }, playerCount),
      ),
    };
  }

  return {
    ...base,
    currentPlayers: normalizePlayers(raw.currentPlayers ?? []),
    nextRoundPlayers: normalizePlayers(
      raw.nextRoundPlayers ?? raw.currentPlayers ?? [],
    ),
    activePersistentRules: (raw.activePersistentRules ?? []).map((ar) =>
      migrateActiveRule(ar as ActivePersistentRule & { remainingTurns?: number }, playerCount),
    ),
  };
}

/** Durée en tours globaux ; null = illimitée. */
function resolveDurationTours(rule: Rule): number | null {
  if (isUnlimitedPersistent(rule)) return null;
  if (typeof rule.duration === 'number') {
    return rule.duration;
  }
  if (rule.duration) {
    const { min, max } = rule.duration as RandomDuration;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  return 1;
}

export function addPlayer(state: GameState, name: string): GameState {
  const player: Player = { id: createId(), name: formatPlayerName(name) };
  return {
    ...state,
    nextRoundPlayers: [...state.nextRoundPlayers, player],
  };
}

export function removePlayer(state: GameState, playerId: string): GameState {
  const removedRules = state.activePersistentRules
    .filter((r) => r.playerId === playerId)
    .map((r) => r.rule);

  return {
    ...state,
    nextRoundPlayers: state.nextRoundPlayers.filter((p) => p.id !== playerId),
    activePersistentRules: state.activePersistentRules.filter(
      (r) => r.playerId !== playerId,
    ),
    rulesToReactivateNextRound: [
      ...state.rulesToReactivateNextRound,
      ...removedRules,
    ],
  };
}

export function reorderPlayers(state: GameState, players: Player[]): GameState {
  return { ...state, nextRoundPlayers: [...players] };
}

export function selectRuleSet(state: GameState, ruleSetId: string): GameState {
  return {
    ...state,
    selectedRuleSetId: ruleSetId,
    drawnSimpleRules: [],
    hasDrawnThisTurn: false,
  };
}

export function shouldPersistGame(game: GameState): boolean {
  return game.isActive || game.nextRoundPlayers.length > 0;
}

function beginActiveRound(state: GameState): GameState {
  const players = [...state.nextRoundPlayers];
  return {
    ...state,
    currentPlayers: players,
    nextRoundPlayers: players,
    currentPlayerIndex: 0,
    activePersistentRules: [],
    rulesToReactivateNextRound: [],
    drawnSimpleRules: [],
    totalTurns: 1,
    isActive: true,
    hasDrawnThisTurn: false,
  };
}

export function startGame(state: GameState): GameState {
  return beginActiveRound(state);
}

/** Recommence à zéro en gardant joueurs et set. */
export function resetRound(state: GameState): GameState {
  return beginActiveRound(state);
}

export function resetGame(): GameState {
  return { ...initialGameState };
}

function getAvailableSimpleRules(
  ruleSet: RuleSet,
  state: GameState,
): Rule[] {
  const simpleRules = getPlayableRules(ruleSet).filter((r) => r.type === 'simple');
  return simpleRules.filter((rule) => {
    if (state.rulesToReactivateNextRound.some((r) => r.id === rule.id)) {
      return false;
    }
    if (ruleSet.exhaustiveSimpleRules) {
      return getRemainingCopies(rule, state.drawnSimpleRules) > 0;
    }
    return true;
  });
}

function getSimpleDrawWeights(
  ruleSet: RuleSet,
  rules: Rule[],
  drawnIds: string[],
): number[] {
  return rules.map((rule) =>
    ruleSet.exhaustiveSimpleRules
      ? getRemainingCopies(rule, drawnIds)
      : getRuleCopies(rule),
  );
}

function getAvailablePersistentRules(
  ruleSet: RuleSet,
  state: GameState,
): Rule[] {
  const persistentRules = getPlayableRules(ruleSet).filter(
    (r) => r.type === 'persistent',
  );
  return persistentRules.filter((rule) => {
    const isActive = state.activePersistentRules.some(
      (ar) => ar.rule.id === rule.id,
    );
    if (isActive && !rule.canBeRedrawn) return false;
    if (state.rulesToReactivateNextRound.some((r) => r.id === rule.id)) {
      return false;
    }
    return true;
  });
}

export type DrawResult =
  | { ok: true; rule: Rule; state: GameState }
  | { ok: false; reason: 'no_rules' | 'cycle_reset'; state?: GameState };

function rollSpecialEvent(
  ruleSet: RuleSet,
  state: GameState,
): DrawResult | null {
  const specialRules = getPlayableRules(ruleSet).filter((r) => r.type === 'special');
  if (specialRules.length === 0) return null;

  const chance = getSpecialTriggerChance(ruleSet);
  if (chance <= 0) return null;
  if (Math.random() >= chance / 100) return null;

  const rule = specialRules[Math.floor(Math.random() * specialRules.length)];
  return {
    ok: true,
    rule,
    state: { ...state, hasDrawnThisTurn: true },
  };
}

export function drawRule(ruleSet: RuleSet, state: GameState): DrawResult {
  const playable = getPlayableRules(ruleSet);
  const hasSimple = playable.some((r) => r.type === 'simple');
  const hasPersistent = playable.some((r) => r.type === 'persistent');

  if (!hasSimple && !hasPersistent) {
    return { ok: false, reason: 'no_rules' };
  }

  const specialEvent = rollSpecialEvent(ruleSet, state);
  if (specialEvent) return specialEvent;

  const persistentChance = getPersistentDrawChance(ruleSet);
  const pickPersistent =
    persistentChance > 0 && Math.random() < persistentChance / 100;

  const availableSimple = getAvailableSimpleRules(ruleSet, state);
  const availablePersistent = getAvailablePersistentRules(ruleSet, state);

  if (!pickPersistent && availableSimple.length === 0) {
    if (
      ruleSet.exhaustiveSimpleRules &&
      isSimpleDeckExhausted(ruleSet, state.drawnSimpleRules)
    ) {
      return {
        ok: false,
        reason: 'cycle_reset',
        state: { ...state, drawnSimpleRules: [] },
      };
    }
    if (availablePersistent.length > 0) {
      return drawPersistentRule(state, availablePersistent);
    }
    return { ok: false, reason: 'no_rules' };
  }

  if (pickPersistent && availablePersistent.length === 0) {
    if (availableSimple.length === 0) {
      if (
        ruleSet.exhaustiveSimpleRules &&
        isSimpleDeckExhausted(ruleSet, state.drawnSimpleRules)
      ) {
        return {
          ok: false,
          reason: 'cycle_reset',
          state: { ...state, drawnSimpleRules: [] },
        };
      }
      return { ok: false, reason: 'no_rules' };
    }
    return drawSimpleRule(ruleSet, state, availableSimple);
  }

  if (pickPersistent) {
    return drawPersistentRule(state, availablePersistent);
  }
  return drawSimpleRule(ruleSet, state, availableSimple);
}

function drawSimpleRule(
  ruleSet: RuleSet,
  state: GameState,
  available: Rule[],
): DrawResult {
  const weights = getSimpleDrawWeights(
    ruleSet,
    available,
    state.drawnSimpleRules,
  );
  const rule = pickWeightedRule(available, weights);
  const newState = {
    ...(ruleSet.exhaustiveSimpleRules
      ? { ...state, drawnSimpleRules: [...state.drawnSimpleRules, rule.id] }
      : state),
    hasDrawnThisTurn: true,
  };
  return { ok: true, rule, state: newState };
}

function drawPersistentRule(
  state: GameState,
  available: Rule[],
): DrawResult {
  const rule = available[Math.floor(Math.random() * available.length)];
  const currentPlayer = state.currentPlayers[state.currentPlayerIndex];
  const newState = activatePersistentRule(state, rule, currentPlayer.id);
  return { ok: true, rule, state: newState };
}

function activatePersistentRule(
  state: GameState,
  rule: Rule,
  drawerPlayerId: string,
): GameState {
  const withoutExisting = state.activePersistentRules.filter(
    (ar) => ar.rule.id !== rule.id,
  );

  const active: ActivePersistentRule = {
    rule,
    playerId: isEveryonePersistent(rule) ? null : drawerPlayerId,
    remainingTours: resolveDurationTours(rule),
    awaitingFirstPass: true,
  };

  return {
    ...state,
    activePersistentRules: [...withoutExisting, active],
    hasDrawnThisTurn: true,
  };
}

/**
 * - Règle « joueur » : décompte quand ce joueur rejoue.
 * - Règle « tout le monde » : décompte à la fin de chaque tour global.
 */
function tickPersistentRules(
  rules: ActivePersistentRule[],
  currentPlayerId: string,
  tourComplete: boolean,
): ActivePersistentRule[] {
  return rules
    .map((ar) => {
      if (ar.remainingTours === null) return ar;
      if (ar.playerId === null) {
        if (!tourComplete) return ar;
        if (ar.awaitingFirstPass) {
          return { ...ar, awaitingFirstPass: false };
        }
        return { ...ar, remainingTours: ar.remainingTours - 1 };
      }
      if (ar.playerId !== currentPlayerId) return ar;
      if (ar.awaitingFirstPass) {
        return { ...ar, awaitingFirstPass: false };
      }
      return { ...ar, remainingTours: ar.remainingTours - 1 };
    })
    .filter((ar) => ar.remainingTours === null || ar.remainingTours > 0);
}

export function nextPlayer(state: GameState): GameState {
  const playerCount = state.currentPlayers.length;
  if (playerCount === 0) return state;

  const nextIndex = (state.currentPlayerIndex + 1) % playerCount;
  const tourComplete = nextIndex === 0;

  const currentPlayerId = state.currentPlayers[state.currentPlayerIndex].id;
  const updatedPersistent = tickPersistentRules(
    state.activePersistentRules,
    currentPlayerId,
    tourComplete,
  );

  if (tourComplete) {
    return {
      ...state,
      activePersistentRules: updatedPersistent,
      currentPlayers: [...state.nextRoundPlayers],
      currentPlayerIndex: 0,
      totalTurns: state.totalTurns + 1,
      rulesToReactivateNextRound: [],
      hasDrawnThisTurn: false,
    };
  }

  return {
    ...state,
    activePersistentRules: updatedPersistent,
    currentPlayerIndex: nextIndex,
    totalTurns: state.totalTurns + 1,
    hasDrawnThisTurn: false,
  };
}

/** Numéro du tour global en cours (1 tour = tous les joueurs ont joué). */
export function getCurrentTour(state: GameState): number {
  if (state.currentPlayers.length === 0) return 1;
  return Math.ceil(state.totalTurns / state.currentPlayers.length);
}

export function hasPendingPlayerChanges(state: GameState): boolean {
  if (state.currentPlayers.length !== state.nextRoundPlayers.length) {
    return true;
  }
  return state.currentPlayers.some(
    (p, i) =>
      p.id !== state.nextRoundPlayers[i]?.id ||
      p.name !== state.nextRoundPlayers[i]?.name,
  );
}
