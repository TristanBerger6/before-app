import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sourcePath =
  process.argv[2] ??
  path.join(process.env.USERPROFILE ?? '', 'Downloads', 'before-origin.json');
const raw = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const payload = { ...raw.ruleSet, name: 'Before Origin' };
const description =
  'Le deck de base Before — 30 règles pour démarrer une soirée.';
const payloadJson = JSON.stringify(payload);

const sql = `insert into public.catalog_lists (id, name, description, payload, version, author_type, sort_order)
values (
  'origin',
  'Before Origin',
  '${description.replace(/'/g, "''")}',
  '${payloadJson.replace(/'/g, "''")}'::jsonb,
  1,
  'official',
  0
)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  payload = excluded.payload,
  version = excluded.version,
  updated_at = now();`;

const outDir = path.join(__dirname, '..', 'supabase', 'seeds');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'catalog_origin_payload.json'), JSON.stringify(payload, null, 2));
fs.writeFileSync(path.join(outDir, 'seed_catalog_origin.sql'), sql);
console.log(sql);
