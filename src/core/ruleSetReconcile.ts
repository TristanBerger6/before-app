import type { GameState, RuleSet } from '../types';

export interface RuleSetReconcileDiff {
  /** Ids retirés de la liste (suppression ou remplacement par édition). */
  purgedRuleIds: string[];
  exhaustiveChanged: boolean;
}

export function isGameUsingRuleSet(game: GameState, ruleSetId: string): boolean {
  return game.isActive && game.selectedRuleSetId === ruleSetId;
}

export function diffRuleSetChanges(prev: RuleSet, next: RuleSet): RuleSetReconcileDiff {
  const nextIds = new Set(next.rules.map((r) => r.id));
  const purgedRuleIds = prev.rules
    .filter((r) => !nextIds.has(r.id))
    .map((r) => r.id);

  const exhaustiveChanged =
    !!prev.exhaustiveSimpleRules !== !!next.exhaustiveSimpleRules;

  return { purgedRuleIds, exhaustiveChanged };
}

export function reconcileGameState(
  game: GameState,
  ruleSet: RuleSet,
  diff: RuleSetReconcileDiff,
): GameState {
  const validIds = new Set(ruleSet.rules.map((r) => r.id));
  const purged = new Set(diff.purgedRuleIds);

  const keepId = (id: string) => validIds.has(id) && !purged.has(id);

  let drawnSimpleRules = game.drawnSimpleRules.filter(keepId);
  let rulesToReactivateNextRound = game.rulesToReactivateNextRound.filter((r) =>
    keepId(r.id),
  );
  let activePersistentRules = game.activePersistentRules.filter((ar) =>
    keepId(ar.rule.id),
  );

  if (diff.exhaustiveChanged) {
    drawnSimpleRules = [];
    rulesToReactivateNextRound = [];
  }

  return {
    ...game,
    drawnSimpleRules,
    rulesToReactivateNextRound,
    activePersistentRules,
  };
}
