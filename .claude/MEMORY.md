# Projekt-Memory

## Infrastruktur
- Server laeuft immer via **Docker** (nicht direkt mit `npx tsx`)
- Zum Neustarten: `docker compose up -d --build` (oder entsprechender Docker-Befehl)
- Port: 12000

## Tech-Stack
- Backend: Express + Socket.io + better-sqlite3, ausgefuehrt via `tsx`
- Frontend: Vue 3 (Composition API, `<script setup>`), Vite, PWA
- Shared Types: `shared/types.ts` (importiert von beiden)
- Monorepo mit npm workspaces

## Projektstruktur
- `server/db.ts` - Datenbank-Layer (SQLite)
- `server/index.ts` - Express API + Socket.io Server
- `shared/types.ts` - Gemeinsame TypeScript-Typen
- `shared/events.ts` - Socket.io Event-Typen
- `frontend/src/views/` - Vue Views (HomeView, GameView)
- `frontend/src/components/` - Vue Components (ScoreBoard, GameResult, PlayerManager, ConnectionBanner)
- `frontend/src/composables/useGameRoom.ts` - Socket.io Game-Room Composable

## Konventionen
- Deutsche UI-Texte (Umlaute als ae/oe/ue)
- Keine Co-Authored-By oder AI-Hinweise in Git-Commits
