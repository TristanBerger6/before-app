import type { PersistentScope, Rule, RuleSet } from '../types';

export function getRuleCopies(rule: Rule): number {
  if (rule.type !== 'simple') return 1;
  const copies = rule.copies ?? 1;
  return Math.max(1, Math.floor(copies));
}

export function getPersistentScope(rule: Rule): PersistentScope {
  return rule.persistentScope ?? 'drawer';
}

export function isEveryonePersistent(rule: Rule): boolean {
  return rule.type === 'persistent' && getPersistentScope(rule) === 'everyone';
}

export function isUnlimitedPersistent(rule: Rule): boolean {
  return rule.type === 'persistent' && rule.durationType === 'unlimited';
}

export function formatActivePersistentMeta(
  rule: Rule,
  remainingTours: number | null,
): string | undefined {
  if (rule.showRemainingTurns === false) return undefined;
  if (remainingTours === null || isUnlimitedPersistent(rule)) return '∞';
  return `${remainingTours} tour${remainingTours > 1 ? 's' : ''}`;
}

/** Badge compact pour la liste d'édition d'une règle persistante. */
export function formatPersistentDurationBadge(rule: Rule): string | undefined {
  if (rule.type !== 'persistent') return undefined;
  if (isUnlimitedPersistent(rule)) return '∞';
  if (typeof rule.duration === 'object') {
    const { min, max } = rule.duration;
    if (min === max) {
      return `${min} tour${min > 1 ? 's' : ''}`;
    }
    return `${min}–${max} tours`;
  }
  const tours = typeof rule.duration === 'number' ? rule.duration : 1;
  return `${tours} tour${tours > 1 ? 's' : ''}`;
}

export function countDrawnCopies(drawnIds: string[], ruleId: string): number {
  return drawnIds.filter((id) => id === ruleId).length;
}

export function getRemainingCopies(
  rule: Rule,
  drawnIds: string[],
): number {
  return Math.max(0, getRuleCopies(rule) - countDrawnCopies(drawnIds, rule.id));
}

const MAX_SPECIAL_TRIGGER_CHANCE = 5;

export const DEFAULT_EXHAUSTIVE_SIMPLE_RULES = true;
export const DEFAULT_SPECIAL_TRIGGER_CHANCE = 2;
export const DEFAULT_PERSISTENT_DRAW_CHANCE = 15;

const MAX_PERSISTENT_DRAW_CHANCE = 50;

export function getSpecialTriggerChance(ruleSet: RuleSet): number {
  if (!hasSpecialRules(ruleSet)) return 0;
  const chance = ruleSet.specialTriggerChance ?? 0;
  return Math.min(MAX_SPECIAL_TRIGGER_CHANCE, Math.max(0, Math.floor(chance)));
}

export function hasSpecialRules(ruleSet: RuleSet): boolean {
  return ruleSet.rules.some((r) => r.type === 'special');
}

export function hasPersistentRules(ruleSet: RuleSet): boolean {
  return ruleSet.rules.some((r) => r.type === 'persistent');
}

export function getPersistentDrawChance(ruleSet: RuleSet): number {
  if (!hasPersistentRules(ruleSet)) return 0;
  const chance = ruleSet.persistentDrawChance ?? DEFAULT_PERSISTENT_DRAW_CHANCE;
  return Math.min(
    MAX_PERSISTENT_DRAW_CHANCE,
    Math.max(0, Math.floor(chance)),
  );
}

export function getSimpleDeckSize(rules: Rule[]): number {
  return rules
    .filter((r) => r.type === 'simple')
    .reduce((sum, r) => sum + getRuleCopies(r), 0);
}

export function isSimpleDeckExhausted(
  ruleSet: RuleSet,
  drawnIds: string[],
): boolean {
  const simpleRules = ruleSet.rules.filter((r) => r.type === 'simple');
  if (simpleRules.length === 0) return false;
  return simpleRules.every(
    (rule) => getRemainingCopies(rule, drawnIds) === 0,
  );
}

/** Tirage pondéré par le nombre d'exemplaires restants / disponibles. */
export function pickWeightedRule(rules: Rule[], weights: number[]): Rule {
  const total = weights.reduce((s, w) => s + w, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < rules.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return rules[i];
  }
  return rules[rules.length - 1];
}
