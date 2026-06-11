import { normalizeGameState } from '../core/gameEngine';
import type { AppData } from '../types';
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

export const localStorageAdapter: StorageAdapter = {
  async load() {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    }
    return parseStored(raw);
  },

  async save(data: AppData) {
    const payload: StoredPayload = { version: VERSION, data };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  },
};
