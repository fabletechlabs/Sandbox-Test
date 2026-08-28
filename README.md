# Cardboard

A small issue tracker — epics, tickets, a board, and comments. It is a real,
working MERN app (MongoDB · Express · React · Node, all in TypeScript) kept
deliberately small so it is easy to read end to end.

This project is the sandbox for a senior engineering technical exercise. It is a
normal codebase: run it, read it, and extend it.

---

## Run it (one command)

You only need Docker.

```bash
docker compose up
```

Then open:

- **Web app** — http://localhost:3000
- **API** — http://localhost:4000/api/health

The database is seeded automatically on first start. To wipe and reseed:

```bash
SEED=reset docker compose up
```

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

## Map of the code

```
issue-tracker/
├── docker-compose.yml        # mongo + api + web
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
└── web/                      # Vite + React + TypeScript
    └── src/
        ├── pages/            # Board, Backlog, Epics, EpicDetail, TicketDetail, Docs
        ├── components/       # TicketCard, TicketModal, Nav, MarkdownContent, ...
        ├── api/              # axios client
        ├── constants.ts      # statuses + types (frontend copy)
        └── types.ts          # shared TS types
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
