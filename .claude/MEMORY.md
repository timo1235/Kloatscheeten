# Project Memory

## Infrastructure
- Server always runs via **Docker** (never start directly with `npx tsx`)
- Restart: `docker compose up -d --build`
- Port: 12000

## Deployment
- Production: kloatscheeten.altholtmann.com
- Hosting: Unraid server (local) behind Caddy reverse proxy on VPS via Tailscale
- SSH: `ssh root@unraid`
- Path on Unraid: `/mnt/user/appdata/cloatscheeten`
- Deploy: `ssh root@unraid "cd /mnt/user/appdata/cloatscheeten && git pull && docker compose up -d --build"`
- Details: see `docs/hosting.md`

## Tech Stack
- Backend: Express + Socket.io + better-sqlite3, run via `tsx`
- Frontend: Vue 3 (Composition API, `<script setup>`), Vite, PWA
- Shared types: `shared/types.ts` (imported by both)
- Monorepo with npm workspaces

## Project Structure
- `server/db.ts` - Database layer (SQLite)
- `server/index.ts` - Express API + Socket.io server
- `shared/types.ts` - Shared TypeScript types
- `shared/events.ts` - Socket.io event types
- `frontend/src/views/` - Vue views (HomeView, GameView)
- `frontend/src/components/` - Vue components (ScoreBoard, GameResult, PlayerManager, ConnectionBanner)
- `frontend/src/composables/useGameRoom.ts` - Socket.io game room composable

## Conventions
- UI texts in German with real umlauts (äöü), not ae/oe/ue
- Code, comments, and memory files in English
- No Co-Authored-By or AI hints in git commits
