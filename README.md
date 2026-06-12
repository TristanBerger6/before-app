# Before

Le jeu qu'on lance avant de sortir, ou même après. Web-app de règles perso entre amis — un téléphone suffit.

## Fonctionnalités (MVP)

- Création et gestion de sets de règles (simple, persistante, spéciale)
- Configuration de partie (joueurs, ordre de passage, choix du set)
- Partie en cours (piocher, événement spécial, règles actives, tour par tour)
- Sauvegarde locale (localStorage)
- Export / import JSON par set de règles
- Mode spectateur live (code à 6 caractères, lecture seule sur un autre appareil)

## Stack

- React + Vite + TypeScript
- Tailwind CSS v4
- Zustand (état applicatif)
- React Router
- @dnd-kit (réorganisation des joueurs)
- Lucide (icônes)

## Démarrage

```bash
npm install
cp .env.example .env.local   # puis remplir les clés Supabase
npm run dev
```

Ouvrir [http://localhost:5173](http://localhost:5173).

### Supabase (auth + listes cloud)

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
3. **Authentication → Providers** :
   - Email : activer
   - Google : activer et configurer (Client ID Google Cloud)
4. **Authentication → Email Templates** : templates brandés dans `supabase/email-templates/` (fond sombre, accent violet, comme l’app). **Resend** ne fait que l’envoi SMTP.

   **Règle** : utiliser `{{ .Token }}` uniquement — **pas** de `{{ .ConfirmationURL }}` (sinon magic link au lieu du code OTP).

   | Template dashboard | Fichier à copier | Sujet suggéré |
   |---|---|---|
   | **Magic link or OTP** | `supabase/email-templates/magic-link-otp.html` | `Votre code Before` |
   | **Confirm signup** | `supabase/email-templates/confirm-signup.html` | `Bienvenue sur Before` |

   Dans le dashboard : ouvrir le template → coller le HTML du fichier → **Save**. Désactiver le tracking de liens chez Resend si possible (il peut casser les URLs).

   **OTP length** : le projet est configuré en **8 chiffres** — doit correspondre à `EMAIL_OTP_LENGTH` dans `src/lib/authConfig.ts` et à **Authentication → Providers → Email**.
5. **Authentication → URL Configuration** (Google OAuth) :
   - Site URL : `http://localhost:5173`
   - Redirect URLs : `http://localhost:5173/auth/callback` (+ URL de prod ; les query `?next=` / `?feedback=` sont autorisées sur ce chemin)
6. **Project Settings → API** : copier URL et `anon` key dans `.env.local`

Sans `.env.local`, l'app fonctionne en **mode invité** (listes en local uniquement, pas de mode spectateur).

### Mode spectateur

L’hôte lance une partie sur son téléphone : un **code à 6 caractères** apparaît en haut de l’écran de jeu. Un autre appareil ouvre `/watch` (ou le lien partagé) et entre le code — **sans compte**.

- Le lecteur voit la **dernière règle piochée**, le joueur actif et les règles persistantes actives.
- Si l’hôte ferme l’app ou perd la connexion (> 30 s) : **partie déconnectée**.
- Fin de partie côté hôte : **partie terminée** pour les lecteurs.
- Les sessions sont **supprimées automatiquement** par un cron Supabase (`pg_cron`, toutes les heures) quand `expires_at` est dépassé (TTL par défaut : 24 h après création). La fin de partie marque `status = ended` mais ne purge pas tout de suite.

### Retours (bugs / idées)

- Icône dans le header de **Partie** et **Spectateur** → modale Bug / Idée.
- **Connexion obligatoire** ; sinon écran « Connecte-toi pour nous écrire » puis retour automatique sur la page d’origine.
- Stockage dans la table `feedback` (dashboard Supabase → **Table Editor**).
- Limite : **1 message / minute / utilisateur** (côté RPC).

**Notifications email (optionnel)** : Edge Function `notify-feedback` + trigger `pg_net` (secrets Resend dans Supabase).

### Catalogue de listes

- Accessible depuis **Mes listes** → **Découvrir le catalogue** (`/sets/catalog`).
- Lecture publique (invités et connectés) via la table `catalog_lists`.
- **Ajouter à mes listes** crée une copie éditable dans `rule_lists` (local ou cloud).
- Pour publier / mettre à jour une liste officielle : éditer le JSON source puis
  `node scripts/seed-catalog-origin.mjs chemin/vers/export.json` et ré-exécuter le SQL généré dans `supabase/seeds/seed_catalog_origin.sql`.

## Build

```bash
npm run build
npm run preview
```

## Architecture

```
src/
  core/       # Moteur de jeu (logique pure, sans React)
  storage/    # Persistance locale (swappable pour API plus tard)
  stores/     # État global Zustand
  components/ # UI réutilisable
  pages/      # Écrans
  types/      # Types partagés
```

## Design

Thème sombre chaud, accent violet (`#A855F7`), typographie **Bricolage Grotesque** + **DM Sans**.

## Déploiement

Build statique compatible Vercel, Netlify ou Cloudflare Pages :

```bash
npm run build
# dist/
```
