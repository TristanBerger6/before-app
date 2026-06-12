import type { RuleSet } from '../types';

/** Fusionne listes locales et cloud (les ids cloud priment en cas de doublon). */
export function mergeRuleLists(cloud: RuleSet[], local: RuleSet[]): RuleSet[] {
  const byId = new Map<string, RuleSet>();
  for (const list of cloud) {
    byId.set(list.id, list);
  }
  for (const list of local) {
    if (!byId.has(list.id)) {
      byId.set(list.id, list);
    }
  }
  return Array.from(byId.values());
}
