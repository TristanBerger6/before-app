# Before

Le jeu qu'on lance avant de sortir, ou même après. Web-app de règles perso entre amis — un téléphone suffit.

## Fonctionnalités

### Listes et catalogue

- Création et gestion de sets de règles (simple, persistante, spéciale)
- Export / import JSON par set
- **Catalogue officiel** (`/sets/catalog`) — lecture publique, copie éditable dans « Mes listes »
- **Before Origin** : deck de base (30 règles), importable en un clic

### Partie (pass-and-play)

- Configuration : joueurs, ordre (drag & drop), choix du set
- **Piocher** / **Suivant** avec guidage visuel (`hasDrawnThisTurn` persisté dans l’état de partie)
- **Événement spécial** : à chaque pioche, probabilité configurable de tirer **directement** une règle spéciale au hasard (modale mise en avant, sans bouton « Spéciale »)
- Règles persistantes actives, remélange des simples (mode exhaustif), recommencer le tour
- **Dernière règle piochée** affichée sur l’écran hôte (même carte que le spectateur), survit à la navigation (ex. paramètres joueurs)
- Sauvegarde locale de la partie en cours (`localStorage`)

### Comptes (optionnel)

- **Invité** : listes et partie en local
- **Connecté** (email OTP ou Google) : listes synchronisées dans Supabase (`rule_lists`)
- Fusion des listes locales à la première connexion (dialogue de migration)

### Mode spectateur live

- L’hôte diffuse la partie via un **code à 6 caractères** (bandeau en haut de `/game`)
- Un autre appareil ouvre `/watch` ou le lien partagé — **sans compte**
- Affichage : joueur actif, **dernière règle piochée**, règles persistantes
- **Compteur de spectateurs** (`👁 N`) dans le bandeau hôte (Realtime Presence)
- Déconnexion hôte détectée après 30 s sans heartbeat ; fin de partie propagée aux lecteurs

### Retours

- Bugs / idées depuis les écrans Partie et Spectateur (auth requise)
- Stockage `feedback` + limite 1 msg/min/utilisateur
- Notification email optionnelle (Edge Function `notify-feedback` + Resend)

## Stack

- React 19 + Vite + TypeScript
- Tailwind CSS v4
- Zustand
- React Router
- @dnd-kit (réorganisation des joueurs)
- Supabase (auth, Postgres, Realtime, Edge Functions)
- @vercel/analytics (stats de visite en prod)
- Lucide (icônes)

## Démarrage

```bash
npm install
cp .env.example .env.local   # puis remplir les clés Supabase
npm run dev
```

Ouvrir [http://localhost:5173](http://localhost:5173).

Sans `.env.local`, l’app fonctionne en **mode invité** (listes et partie en local uniquement, pas de spectateur ni sync cloud).

### Supabase

1. Créer un projet sur [supabase.com](https://supabase.com)
2. **SQL Editor** → exécuter les migrations dans l’ordre :
   - `supabase/migrations/20250607120000_rule_lists.sql`
   - `supabase/migrations/20250612120000_game_sessions.sql`
   - `supabase/migrations/20250612130000_purge_game_sessions_cron.sql`
   - `supabase/migrations/20250612140000_game_sessions_last_drawn_by.sql`
   - `supabase/migrations/20250613120000_feedback.sql`
   - `supabase/migrations/20250613140000_feedback_notify_trigger.sql`
   - `supabase/migrations/20250613150000_catalog_lists.sql`
   - `supabase/migrations/20250613150100_catalog_origin_seed.sql`
   - `supabase/migrations/20250613150200_catalog_origin_remove_pile_ou_face.sql`
3. **Authentication → Providers** :
   - Email : activer (OTP)
   - Google : activer et configurer (Client ID Google Cloud)
4. **Authentication → Email Templates** : templates dans `supabase/email-templates/` (fond sombre, accent violet).

   **Règle** : utiliser `{{ .Token }}` uniquement — **pas** de `{{ .ConfirmationURL }}` (sinon magic link au lieu du code OTP).

   | Template dashboard | Fichier à copier | Sujet suggéré |
   |---|---|---|
   | **Magic link or OTP** | `supabase/email-templates/magic-link-otp.html` | `Votre code Before` |
   | **Confirm signup** | `supabase/email-templates/confirm-signup.html` | `Bienvenue sur Before` |

   **OTP length** : **8 chiffres** — aligné avec `src/lib/authConfig.ts` et **Authentication → Providers → Email**.
5. **Authentication → URL Configuration** :
   - Site URL : `http://localhost:5173`
   - Redirect URLs : `http://localhost:5173/auth/callback` (+ URL de prod)
6. **Project Settings → API** : copier URL et clé `anon` dans `.env.local` :

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### Temps réel (parties live)

Deux mécanismes Supabase Realtime (WebSocket, pas de webhooks) :

| Usage | Mécanisme |
|-------|-----------|
| État de partie (spectateur) | **Postgres Changes** sur `game_sessions` — l’hôte pousse via RPC `sync_game_session`, les lecteurs reçoivent les `UPDATE` |
| Compteur spectateurs | **Presence** sur un canal dédié — chaque lecteur `track` à la connexion, l’hôte compte les présences |

L’hôte envoie aussi un **heartbeat** toutes les 15 s (`host_seen_at`). Les spectateurs ont un **polling** de secours toutes les 10 s si Realtime est indisponible.

Les sessions expirent après 24 h (`expires_at`) et sont purgées par un cron `pg_cron` (toutes les heures).

### Catalogue officiel

- **Mes listes** → **Découvrir le catalogue** (`/sets/catalog`)
- Table `catalog_lists` (lecture publique, RLS)
- Pour mettre à jour **Before Origin** :

```bash
node scripts/seed-catalog-origin.mjs chemin/vers/export.json
# puis appliquer le SQL généré dans supabase/seeds/seed_catalog_origin.sql
# (ou créer une nouvelle migration)
```

### Notifications feedback (optionnel)

Edge Function `supabase/functions/notify-feedback` + trigger `pg_net` sur insert `feedback`. Secrets Resend à configurer dans le dashboard Supabase.

## Routes principales

| Route | Description |
|-------|-------------|
| `/` | Accueil |
| `/sets` | Mes listes |
| `/sets/catalog` | Catalogue officiel |
| `/setup` | Configurer une partie |
| `/game` | Partie en cours |
| `/game/settings` | Joueurs en cours de partie |
| `/watch` | Rejoindre en spectateur |
| `/watch/:code` | Spectateur (lien direct) |
| `/auth` | Connexion (optionnelle) |

## Build

```bash
npm run build
npm run preview
```

## Architecture

```
src/
  core/       # Moteur de jeu (logique pure, sans React)
  storage/    # localStorage, Supabase (listes, sessions, catalogue, présence)
  stores/     # Zustand (app, auth, live host, spectateur)
  components/ # UI réutilisable
  pages/      # Écrans
  types/      # Types partagés
supabase/
  migrations/     # Schéma Postgres + RPC + Realtime publication
  functions/        # Edge Functions (notify-feedback)
  email-templates/  # Templates auth brandés
  seeds/            # Payload catalogue (Before Origin)
```

**Modèle de données live** : l’hôte est la source de vérité (état en local) ; chaque action pousse un snapshot JSON dans `game_sessions`. Les spectateurs ne font que lire.

## Design

Thème sombre chaud, accent violet (`#A855F7`), typographie **Bricolage Grotesque** + **DM Sans**.

## Déploiement

Build statique compatible Vercel, Netlify ou Cloudflare Pages :

```bash
npm run build
# dist/
```

Sur Vercel : `@vercel/analytics` est actif automatiquement. Penser à configurer les variables `VITE_SUPABASE_*` et les redirect URLs Supabase pour l’URL de prod.
