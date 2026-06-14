import { normalizeGameState, shouldPersistGame } from '../core/gameEngine';
import type { AppData, GameState, RuleSet } from '../types';
import type { StorageAdapter } from './types';

const STORAGE_KEY = 'before:data';
const LEGACY_STORAGE_KEY = 'jeu-orange:data';
const VERSION = 1;

interface StoredPayload {
  version: number;
  data: AppData;
}

function defaultData(): AppData {
  return { ruleSets: [], game: null };
}

function parseStored(raw: string | null): AppData {
  if (!raw) return defaultData();
  try {
    const payload = JSON.parse(raw) as StoredPayload;
    if (payload.version !== VERSION || !payload.data) {
      return defaultData();
    }
    return {
      ruleSets: payload.data.ruleSets ?? [],
      game: payload.data.game
        ? normalizeGameState(payload.data.game)
        : null,
    };
  } catch {
    return defaultData();
  }
}

function readRaw(): string | null {
  return (
    localStorage.getItem(STORAGE_KEY) ??
    localStorage.getItem(LEGACY_STORAGE_KEY)
  );
}

export async function loadLocalRuleSets(): Promise<RuleSet[]> {
  const data = parseStored(readRaw());
  return data.ruleSets;
}

export async function clearLocalRuleSets(): Promise<void> {
  const data = parseStored(readRaw());
  await localStorageAdapter.save({ ...data, ruleSets: [] });
}

export const localStorageAdapter: StorageAdapter = {
  async load() {
    return parseStored(readRaw());
  },

  async save(data: AppData) {
    const payload: StoredPayload = { version: VERSION, data };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  },
};

export async function saveGameToLocal(game: GameState | null): Promise<void> {
  const current = parseStored(readRaw());
  await localStorageAdapter.save({
    ruleSets: current.ruleSets,
    game: game && shouldPersistGame(game) ? game : null,
  });
}
