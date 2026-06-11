import type { AppData } from '../types';

export interface StorageAdapter {
  load(): Promise<AppData>;
  save(data: AppData): Promise<void>;
}
