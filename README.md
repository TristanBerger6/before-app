# Before

Le jeu qu'on lance avant de sortir, ou même après. Web-app de règles perso entre amis — un téléphone suffit.

## Fonctionnalités (MVP)

- Création et gestion de sets de règles (simple, persistante, spéciale)
- Configuration de partie (joueurs, ordre de passage, choix du set)
- Partie en cours (piocher, événement spécial, règles actives, tour par tour)
- Sauvegarde locale (localStorage)
- Export / import JSON par set de règles

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
2. **SQL Editor** → exécuter `supabase/migrations/20250607120000_rule_lists.sql`
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
   - Redirect URLs : `http://localhost:5173/auth/callback` (+ URL de prod)
6. **Project Settings → API** : copier URL et `anon` key dans `.env.local`

Sans `.env.local`, l'app fonctionne en **mode invité** (listes en local uniquement).

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
