import { createId } from './ids';
import type { RuleSet } from '../types';

const EXPORT_TYPE = 'before/ruleset';
const LEGACY_EXPORT_TYPE = 'jeu-d-orange/ruleset';
const EXPORT_VERSION = 1;

export interface RuleSetExportPayload {
  type: typeof EXPORT_TYPE;
  version: number;
  exportedAt: string;
  ruleSet: RuleSet;
}

function isRuleSet(value: unknown): value is RuleSet {
  if (!value || typeof value !== 'object') return false;
  const rs = value as RuleSet;
  return (
    typeof rs.name === 'string' &&
    Array.isArray(rs.rules) &&
    rs.rules.every((r) => {
      if (
        typeof r.title !== 'string' ||
        typeof r.description !== 'string' ||
        !['simple', 'persistent', 'special'].includes(r.type)
      ) {
        return false;
      }
      if (r.copies != null && (typeof r.copies !== 'number' || r.copies < 1)) {
        return false;
      }
      return true;
    }) &&
    (rs.specialTriggerChance == null ||
      (typeof rs.specialTriggerChance === 'number' &&
        rs.specialTriggerChance >= 0 &&
        rs.specialTriggerChance <= 5)) &&
    (rs.persistentDrawChance == null ||
      (typeof rs.persistentDrawChance === 'number' &&
        rs.persistentDrawChance >= 0 &&
        rs.persistentDrawChance <= 50))
  );
}

export function cloneRuleSetWithNewIds(ruleSet: RuleSet): RuleSet {
  return {
    ...ruleSet,
    id: createId(),
    rules: ruleSet.rules.map((rule) => ({
      ...rule,
      id: createId(),
    })),
  };
}

export function serializeRuleSet(ruleSet: RuleSet): string {
  const payload: RuleSetExportPayload = {
    type: EXPORT_TYPE,
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    ruleSet,
  };
  return JSON.stringify(payload, null, 2);
}

export function parseRuleSetFile(json: string): RuleSet {
  const parsed: unknown = JSON.parse(json);

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Format de fichier invalide');
  }

  const obj = parsed as Record<string, unknown>;

  if (
    (obj.type === EXPORT_TYPE || obj.type === LEGACY_EXPORT_TYPE) &&
    isRuleSet(obj.ruleSet)
  ) {
    return cloneRuleSetWithNewIds(obj.ruleSet);
  }

  if (isRuleSet(obj.ruleSet)) {
    return cloneRuleSetWithNewIds(obj.ruleSet);
  }

  if (isRuleSet(obj)) {
    return cloneRuleSetWithNewIds(obj as RuleSet);
  }

  const legacySets =
    (Array.isArray(obj.ruleSets) ? obj.ruleSets : null) ??
    (Array.isArray(obj.rulesets) ? obj.rulesets : null);

  if (legacySets?.length === 1 && isRuleSet(legacySets[0])) {
    return cloneRuleSetWithNewIds(legacySets[0]);
  }

  if (legacySets && legacySets.length > 1) {
    throw new Error(
      'Ce fichier contient plusieurs listes. Exportez une seule liste à la fois.',
    );
  }

  throw new Error('Format de fichier invalide');
}

export function downloadRuleSet(ruleSet: RuleSet): void {
  const json = serializeRuleSet(ruleSet);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const slug = ruleSet.name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'set';
  const a = document.createElement('a');
  a.href = url;
  a.download = `before-${slug}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
