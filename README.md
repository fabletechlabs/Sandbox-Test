# Cardboard

A small issue tracker — epics, tickets, a board, and comments. It is a real,
working MERN app (MongoDB · Express · React · Node, all in TypeScript) kept
deliberately small so it is easy to read end to end.

---

## Run it (one command)

### In GitHub Codespaces

Select **Code → Create codespace on main**. The codespace builds the images when
it is created and starts them when it attaches, so there is nothing to install.

When port 3000 comes up, VS Code shows a notification. Select **Open in
Browser**, or open the **Ports** panel and select the globe icon on port 3000.
Use a real browser tab rather than the built-in preview pane, so the browser
developer tools are available.

The web app calls `/api` on its own address, and the dev server sends those
calls to the API container. Only the web port must be open. Port 4000 is
forwarded as well, so `curl` against the API works from the codespace terminal.

### On your own machine

You only need Docker.

```bash
docker compose up
```

Then open:

- **Web app** — http://localhost:3000
- **API** — http://localhost:4000/api/health

The database is seeded automatically on first start. See
[Reset or reseed the database](#reset-or-reseed-the-database) to reload it later.

To run it again from scratch (fresh database):

```bash
docker compose down -v && docker compose up
```

### Ports

| Service | URL                          |
| ------- | ---------------------------- |
| Web     | http://localhost:3000        |
| API     | http://localhost:4000/api    |
| MongoDB | mongodb://localhost:27017    |

---

## Reset or reseed the database

There are two VS Code tasks for this. They work the same in a codespace and on
your own machine.

Open the Command Palette (`F1`, or `Ctrl`/`Cmd` + `Shift` + `P`), run **Tasks:
Run Task**, then pick one:

| Task                                            | What it does                                                                      |
| ----------------------------------------------- | --------------------------------------------------------------------------------- |
| Cardboard: reset database to sample data        | Wipes the database and reinserts the small curated sample set.                    |
| Cardboard: load large dataset (5,000 tickets)   | Reseeds with 5,000 extra tickets, so the board is noticeably slow.                |

The api container has to be running. If a task reports `no such service`, run
`docker compose up -d` first and try again.

The equivalents from a terminal, if you would rather not use the palette:

```bash
docker compose exec -T api npm run seed
docker compose exec -T -e SEED_TICKETS=5000 api npm run seed
```

`SEED=reset docker compose up` also reseeds, but only at container start.

---

## Map of the code

```
issue-tracker/
├── docker-compose.yml        # mongo + api + web
├── .vscode/tasks.json        # reset / reseed tasks (Tasks: Run Task)
├── api/                      # Express + Mongoose + TypeScript
│   └── src/
│       ├── server.ts         # entry: connect, seed, listen
│       ├── app.ts            # express app + middleware
│       ├── db.ts             # mongo connection
│       ├── config.ts         # env config
│       ├── constants.ts      # statuses + types
│       ├── seed.ts           # sample data
│       ├── simulate.ts       # traffic simulator (fires the webhook on a loop)
│       ├── models/           # Epic, Ticket, Comment, Member, Doc, User, Email
│       ├── services/         # epicService, userService, mailer (mock SES)
│       ├── controllers/      # epic / ticket / board / doc / user / webhook / meta
│       └── routes/           # /api routes
├── web/                      # Vite + React + TypeScript
│   └── src/
│       ├── pages/            # Board, Backlog, Epics, EpicDetail, TicketDetail, Docs
│       ├── components/       # TicketCard, TicketModal, Nav, MarkdownContent, ...
│       ├── api/               # axios client
│       ├── constants.ts      # statuses + types (frontend copy)
│       └── types.ts          # shared TS types
└── lambda/                   # serverless port of the webhook (not run by docker compose)
    └── src/webhookHandler.ts
```

## What's in it

- **Epics** group related work and show a progress bar.
- **Tickets** have a key (e.g. `CARD-14`), title, description, acceptance
  criteria, type, status, estimate, assignee, and an optional epic.
- **Board** shows tickets in columns by status.
- **Backlog** is a filterable list of everything.
- **Comments** live on a ticket.
- **Docs** is a small wiki: markdown pages that render mermaid diagrams.
- **Integration flow**: an inbound webhook provisions a user and sends a welcome
  email through a mock provider, recorded in an inspectable "outbox". A background
  `simulator` service keeps firing it, so there's always live traffic to watch
  (pause with `docker compose stop simulator`).

## API quick reference

```
GET    /api/health
GET    /api/board
GET    /api/members
GET    /api/epics            POST /api/epics
GET    /api/epics/:id        PATCH /api/epics/:id
GET    /api/tickets          POST /api/tickets
GET    /api/tickets/:id      PATCH /api/tickets/:id   DELETE /api/tickets/:id
POST   /api/tickets/reorder
POST   /api/tickets/:id/comments
GET    /api/docs             POST /api/docs
GET    /api/docs/:slug       PATCH /api/docs/:id      DELETE /api/docs/:id
GET    /api/users            GET  /api/outbox
POST   /api/webhooks/user-provisioned   # inbound webhook: provisions a user + emails them
```

## Running the pieces without Docker (optional)

Each folder is a standalone Node project. You need a MongoDB running locally.

```bash
# api
cd api && npm install && npm run dev      # http://localhost:4000

# web
cd web && npm install && npm run dev      # http://localhost:3000
```
