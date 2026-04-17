# Hono Imageboard MVP

Server-rendered anonymous board app built with Hono’s route-first style.

## Stack

- Hono + Hono JSX (server-rendered HTML)
- TypeScript
- SQLite (`better-sqlite3`)
- Plain form POST flows (no SPA)

## Current features

- Board index (`/`) with seeded boards (`/b`, `/tech`, `/art`)
- Board pages with thread list + reply counts
- Thread pages with replies
- Anonymous/default name fallback (`Anonymous`) and optional display name
- Thread creation + reply creation via form POST
- 303 redirects after successful posts
- Friendly 404/500 pages and board/thread missing states
- Validation errors rendered inline with `422` statuses
- Basic lock awareness in replies (locked threads reject new replies)
- Middleware: logger, request-id, body-size limit, security headers

## Project structure

```txt
src/
  db/
    client.ts
    repository.ts
  middleware/
    request-id.ts
    security-headers.ts
  routes/
    boards.tsx
    threads.tsx
  views/
    layout.tsx
  index.tsx
  app.test.ts
```

## Run locally

```bash
npm install
npm run dev
```

## Test

```bash
npm test
```

### Test strategy (current)

- Use `app.request()` against the in-memory Hono app surface (no browser).
- Use an isolated SQLite test database file per run (`DB_PATH` env var).
- Cover HTTP status behavior, validation, and output escaping.

## Next roadmap

- Phase 2: full pin/lock ordering and UI badges
- Phase 3: tiny admin moderation gate
- Phase 4: old-school UI polish
- Phase 5: anti-abuse guardrails
- Phase 6+: broader moderation and behavior test coverage
