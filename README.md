# Relay

A real-time collaborative project board. Drag a task and every teammate's
screen updates within a few hundred milliseconds, no refresh, no polling.
Each task also has an on-demand AI summary, generated from its description
and comment thread, for when a card has accumulated more discussion than
anyone has time to re-read.

Built as a portfolio project to demonstrate full-stack architecture beyond
CRUD: real-time sync, optimistic UI, server-authoritative permissions, and
a production LLM integration (not just a chat wrapper).

## Why this project

Most "todo app" portfolio pieces stop at create/read/update/delete. Relay
adds two things that are genuinely harder to get right:

1. **Real-time multiplayer state**, when User A drags a card, User B's
   browser needs to reflect that move without a refresh, and without two
   users' simultaneous edits corrupting the board's ordering.
2. **An LLM feature that's actually useful**, not decorative, the AI
   summary exists because "read the last 20 comments" is a real annoyance
   on any project board with more than a few active users.

## Architecture

```
Browser (Zustand store)
   ↕ optimistic update              ↕ Pusher WebSocket (subscribe)
Server Action (moveTask)  ──trigger──→  Pusher Channels  ──push──→  Other browsers
   ↓
PostgreSQL (Prisma) — position stored as Float for O(1) reordering
```

**Drag-and-drop ordering** uses fractional/lexicographic positioning:
moving a task between two existing tasks computes `(prev + next) / 2`
rather than renumbering every task in the column. This is the same trick
used by Figma's layer ordering and Trello's card ordering — it keeps a
drag-and-drop move to a single row update regardless of column size. See
`src/lib/utils.ts` (`positionBetween`) and the test in `tests/utils.test.ts`.

**Permissions are enforced server-side, not just hidden client-side.**
Every mutation in `src/server/actions/task.actions.ts` re-checks workspace
membership before touching the database, the client's UI state is treated
as a hint, never as an access grant. See `requireBoardAccess()`.

**Real-time sync** flows through [Pusher Channels](https://pusher.com)
rather than a self-hosted WebSocket server, so the app stays deployable to
Vercel's serverless runtime with a live demo link, at the cost of a
third-party dependency for the real-time layer. A self-hosted Socket.io
server would remove that dependency but requires a long-running Node
process (e.g. Railway/Render) instead of serverless hosting.

## Stack

| Layer      | Choice                                    |
|------------|--------------------------------------------|
| Framework  | Next.js 14 (App Router), TypeScript         |
| Database   | PostgreSQL + Prisma ORM                     |
| Auth       | NextAuth.js (GitHub OAuth + credentials)    |
| Real-time  | Pusher Channels                             |
| AI         | Anthropic API (Claude) for task summaries   |
| Drag/drop  | dnd-kit                                     |
| Styling    | Tailwind CSS                                |
| State      | Zustand (client), Server Actions (mutations)|
| Testing    | Vitest                                      |
| CI         | GitHub Actions (lint, typecheck, test, build)|

## Getting started

### 1. Prerequisites
- Node.js 20+
- Docker (for local Postgres) — or your own Postgres instance

### 2. Clone and install
```bash
git clone https://github.com/gustisuryaa/relay.git
cd relay
npm install
```

### 3. Environment variables
```bash
cp .env.example .env
```
Fill in:
- `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`
- `GITHUB_ID` / `GITHUB_SECRET` from a [GitHub OAuth App](https://github.com/settings/developers) (callback URL: `http://localhost:3000/api/auth/callback/github`)
- `PUSHER_*` — free tier at [pusher.com](https://pusher.com) → Channels
- `ANTHROPIC_API_KEY` — from [console.anthropic.com](https://console.anthropic.com)

### 4. Database
```bash
docker compose up -d          # starts Postgres on :5432
npm run db:push               # applies the Prisma schema
npm run db:seed               # optional: seeds a demo workspace + board
```
Demo login after seeding: `demo@relay.app` / `password123`

### 5. Run
```bash
npm run dev
```
Visit `http://localhost:3000`.

## Testing
```bash
npm run test        # run once
npm run test:watch  # watch mode
```

## Project structure
```
src/
├── app/                  # Next.js routes (App Router)
│   ├── (auth)/login/
│   ├── (dashboard)/boards/[boardId]/
│   └── api/              # NextAuth, registration, AI summarize, workspaces
├── components/board/     # Board, Column, TaskCard, TaskDetailModal
├── server/actions/       # Server Actions — all mutations + auth checks live here
├── lib/                  # Prisma client, NextAuth config, Pusher, Claude API, utils
├── hooks/                # Zustand store + realtime subscription hook
└── types/                # NextAuth type augmentation
prisma/
├── schema.prisma
└── seed.ts
tests/
```

## Known limitations / next steps
- No column reordering UI yet (columns are seeded in a fixed order; the
  `position: Float` field already supports it, just needs a drag handle
  on the column header).
- No optimistic-update rollback on server action failure, a failed move
  is corrected on next realtime event or refresh rather than immediately.
  Acceptable for a project board's low stakes; would need proper rollback
  for something transactional.
- No workspace invite flow `WorkspaceMember` rows currently have to be
  created directly (e.g. via Prisma Studio) since the UI only covers
  workspace creation, not inviting teammates by email.

## License
MIT — see [LICENSE](./LICENSE).
