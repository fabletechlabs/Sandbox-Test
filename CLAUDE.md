# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

Cardboard is a small MERN issue tracker (MongoDB, Express, React, Node, all
TypeScript). It is the sandbox for a senior full-stack technical interview.
`INTERVIEWER.md` is the internal run-sheet for that panel. `README.md` is the
document the candidate reads.

**The known defects are deliberate.** They are the interview questions. Do not
repair them unless the user asks for a repair. If you find one, report it and
wait.

| Deliberate defect | Location |
| --- | --- |
| Cached epic progress drifts. Only the create path increments `Epic.stats`; patch, delete and reorder do not. The seed data starts already drifted. | `api/src/controllers/ticketController.ts:51`, `api/src/seed.ts:27` |
| N+1 queries. The board runs one `Epic.findById` for each ticket; the epic list runs one `Ticket.find` for each epic. | `api/src/controllers/boardController.ts:17`, `api/src/controllers/epicController.ts:14` |
| No indexes and no pagination on tickets. | `api/src/models/Ticket.ts` |
| Fat controller. `postTicket` holds its logic inline and does not use a service, unlike `postEpic`. | `api/src/controllers/ticketController.ts:34` |
| Weak validation. `postTicket` checks only `title` and passes the remaining body fields straight through. `patchTicket` passes the full request body to `findByIdAndUpdate`. | `api/src/controllers/ticketController.ts:34`, `:64` |
| Key generation races. `CARD-n` and `EPIC-n` come from `countDocuments()`. | `api/src/controllers/ticketController.ts:37`, `api/src/services/epicService.ts:15` |
| The webhook answers 202 but is not idempotent. A retry provisions a second user. | `api/src/controllers/webhookController.ts` |
| `Ticket.assignee` holds a member name as a string. It is not a reference to `Member` or `User`. | `api/src/models/Ticket.ts:13` |
| The board computes epic percentages in the component instead of on the server. | `web/src/pages/Board.tsx:59` |
| The status and type constants exist twice, once for each side. `web/src/constants.ts` says to keep the duplication. | `api/src/constants.ts`, `web/src/constants.ts` |

Two properties of the code are deliberate quality, not defects. Keep them:

- The front end is accessibility-first. Look at the skip link and `tabIndex={-1}`
  target in `web/src/App.tsx`, `useDocumentTitle` in `web/src/utils.ts`, and the
  `role="img"` and `<details>` source fallback in `MarkdownContent.tsx`.
- `MarkdownContent.tsx` sanitizes with DOMPurify before every
  `dangerouslySetInnerHTML`, and again on the mermaid SVG. Do not remove a
  sanitize step.

## Commands

Docker Compose is the primary path. It starts four services: `mongo`, `api`,
`web` and `simulator`.

```bash
docker compose up                              # start all four services
docker compose logs -f api                     # watch the webhook trace
docker compose down -v && docker compose up    # start again with an empty database

docker compose exec api npm run seed                          # reset the data
docker compose exec -e SEED_TICKETS=5000 api npm run seed     # add 5000 tickets, to feel the N+1
SEED=reset docker compose up                                  # wipe and reseed at start

docker compose stop simulator                  # stop the webhook traffic
docker compose start simulator                 # start it again
```

Web is on <http://localhost:3000>. API is on <http://localhost:4000/api>.

The repository also runs in GitHub Codespaces. `.devcontainer/devcontainer.json`
builds the images on create and starts them on attach. The browser calls `/api`
on the web origin, and the Vite dev server proxies those calls to the API
container, so only the web port must be open. Three settings make this work, and
all three are necessary:

- `server.proxy` in `web/vite.config.ts` sends `/api` to `VITE_PROXY_TARGET`.
  Compose sets that to `http://api:4000`; a standalone `npm run dev` falls back
  to `http://localhost:4000`.
- `server.allowedHosts` lists `.app.github.dev`. Vite 5.4.12 and later answer
  403 to a Host header that is not on that list, and `host: true` does not
  exempt it.
- `server.hmr.clientPort` becomes 443 when `CODESPACES` is set, because the
  forwarded host serves the websocket on the HTTPS port.

Do not reintroduce an absolute `VITE_API_URL` that points at `localhost`. In a
codespace, `localhost` is the browser's own machine, not the container.

`.devcontainer/devcontainer.json` names its base image
(`javascript-node:1-20-bookworm`) and adds Docker and SSH as features. Do not
remove the `image` line: without one, `create` still works, because Codespaces
supplies its own default, but `Rebuild Container` does not — it falls back to
Alpine, which has no Docker, and the codespace still reports itself healthy.
Do not switch the image to `universal`, either: Docker installs on it, but
`universal` is large enough that a first create measured about ten minutes,
against about five for `javascript-node`. And do not add `docker-in-docker` to
`universal` if a future edit brings it back — that combination fails outright,
because `universal` carries a yarn apt source whose signing key no longer
verifies.

Each folder is also a standalone Node project, and needs a local MongoDB:

```bash
cd api && npm install && npm run dev      # tsx watch, port 4000
cd api && npm run typecheck               # tsc --noEmit

cd web && npm install && npm run dev      # vite, port 3000
cd web && npm run build                   # tsc && vite build — the only typecheck for the web
```

**There is no test suite and no linter.** No test script, no Jest, no Vitest, no
ESLint config. `npm run typecheck` in `api/` and `npm run build` in `web/` are
the only automated checks. If you need a test to prove a change, say that you
must add the framework first.

Fire one webhook by hand:

```bash
curl -X POST localhost:4000/api/webhooks/user-provisioned \
  -H 'x-webhook-secret: dev-secret' -H 'content-type: application/json' \
  -d '{"email":"a@example.com","name":"Ada","source":"hr"}'
```

## Architecture

### API — `api/src`

The layers go route → controller → (service) → Mongoose model.

- `server.ts` connects, seeds, and listens. `app.ts` builds the Express app:
  `cors`, `express.json`, the `/api` router, a 404 for unknown `/api` paths, and
  a central error handler that turns Mongoose `CastError` into 400.
- `routes/index.ts` is the one route table. Every async handler goes through
  `ah()` from `util/asyncHandler.ts`, which forwards a rejected promise to the
  error middleware. A new async route must use `ah()`.
- Controllers hold the HTTP concerns. Only epics and users have a service layer
  (`epicService`, `userService`). The other controllers talk to the models
  directly. `epicService.updateEpic` shows the field allow-list pattern; no other
  update path uses it.
- Models are plain Mongoose schemas with `{ timestamps: true }` and no virtuals.
  `Doc.ts` also exports `generateUniqueSlug`.
- `config.ts` reads every environment variable in one place: `MONGODB_URI`,
  `PORT`, `SEED`, `WEBHOOK_SECRET`. Read config from there, not from
  `process.env`.
- Logs use a `[tag]` prefix — `[api]`, `[db]`, `[seed]`, `[webhook]`, `[users]`,
  `[mailer]`, `[simulator]`.

### The webhook flow

This is the chain the interview asks the candidate to trace. One correlation id
threads through all of it:

`POST /api/webhooks/user-provisioned` → `webhookController.handleUserProvisioned`
(compares the `x-webhook-secret` header, answers 401 on a mismatch) →
`userService.provisionUser` (creates the `User`) → `mailer.sendWelcomeEmail` →
`mailer.sendEmail`, which is a mock of Amazon SES and writes an `Email` document
instead of sending. Read the result at `GET /api/outbox`.

`simulate.ts` runs as the `simulator` container and fires that webhook every
`SIMULATE_INTERVAL` ms (10s default), so the logs always have live traffic. Set
`SIMULATE_BAD_SECRET_RATE` to make some of them fail with 401.

### Web — `web/src`

Vite and React 18 with `react-router-dom`. There is no state library and no data
fetching library.

- `App.tsx` holds the routes. Each page in `pages/` owns its own
  `useState`/`useEffect` fetch, its own `isLoading` and `error` state, and calls
  `useDocumentTitle`.
- Every request goes through the typed wrapper functions in `api/client.ts`. Add
  a function there rather than calling `axios` from a component. The base URL is
  the relative path `/api`, which the dev server proxies. `VITE_API_URL`
  overrides it, but leave it unset.
- After a mutation, the page refetches all of its data. See `loadData` in
  `Board.tsx`. There is no cache to invalidate.
- `types.ts` holds the shared response shapes. `constants.ts` holds the statuses
  and types, plus `getStatusLabel`/`getTypeLabel`, which cope with a value
  outside the known set. The seed data contains `status: 'blocked'`, which is one
  such value, and the board groups it into a trailing "Other" column.
- Styling is one hand-written stylesheet, `styles.css`. There is no CSS framework.

### Data model

`Epic` ← `Ticket` (`epicId`, nullable) ← `Comment` (`ticketId`). `Member` is the
assignee list and is unrelated to `User`, which the webhook creates. `Email` is
the outbox. `Doc` is the wiki page, keyed by `slug`, and its markdown body may
hold a mermaid diagram.
