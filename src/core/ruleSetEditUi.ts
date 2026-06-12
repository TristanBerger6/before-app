import type { RuleType } from '../types';

export type RuleSetSectionKey = 'settings' | RuleType;

function storageKey(setId: string): string {
  return `before:ruleset-sections:${setId}`;
}

export function readRuleSetSectionState(
  setId: string,
): Partial<Record<RuleSetSectionKey, boolean>> {
  try {
    const raw = sessionStorage.getItem(storageKey(setId));
    if (!raw) return {};
    return JSON.parse(raw) as Partial<Record<RuleSetSectionKey, boolean>>;
  } catch {
    return {};
  }
}

export function writeRuleSetSectionState(
  setId: string,
  state: Partial<Record<RuleSetSectionKey, boolean>>,
): void {
  sessionStorage.setItem(storageKey(setId), JSON.stringify(state));
}
