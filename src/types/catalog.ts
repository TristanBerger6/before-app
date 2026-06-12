import type { RuleSet } from './index';

export type CatalogAuthorType = 'official' | 'community';

export interface CatalogListEntry {
  id: string;
  name: string;
  description: string | null;
  payload: RuleSet;
  version: number;
  authorType: CatalogAuthorType;
  sortOrder: number;
  publishedAt: string;
}
