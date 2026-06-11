# Before

Le jeu qu'on lance avant de sortir. Web-app de règles perso pour animer un apéro entre amis — un téléphone suffit.

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
npm run dev
```

Ouvrir [http://localhost:5173](http://localhost:5173).

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
