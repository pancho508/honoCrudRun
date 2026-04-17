# Hono Imageboard MVP (Phase 1)

Server-rendered imageboard/forum prototype built to learn Hono's mental model first:

- **Context-driven handlers** (`c.req`, `c.html`, `c.json`, request-scoped values)
- **Route-first design** (handlers near route definitions)
- **Sub-app composition** with `app.route()`
- **Middleware-first cross-cutting concerns**

## Stack

- Hono
- TypeScript
- SQLite (`better-sqlite3`)
- Hono JSX for HTML rendering
- Plain HTML forms (no SPA behavior)

## Features in this MVP

- Home page listing boards
- Board pages: `/b`, `/tech`, `/art`
- Create thread via form POST
- Reply to thread via form POST
- Thread bump order updates on new replies
- No auth (anonymous posting)

## Project structure

```txt
src/
  db/
    client.ts        # SQLite setup + schema + seed boards
    repository.ts    # Query helpers
  middleware/
    request-id.ts
    security-headers.ts
  routes/
    boards.tsx
    threads.tsx
  views/
    layout.tsx
  index.tsx          # App bootstrap and route mounting
```

## Run locally

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>.

## Notes for next phases

- Add image/file upload for OP/replies
- Add tripcode-style identity
- Add moderation routes and tools
- Add CSRF middleware and stronger validation
- Optional: adopt Drizzle for explicit schema + migrations
