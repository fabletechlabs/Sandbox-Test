# Interviewer run-sheet — Cardboard senior panel

Internal. The live script for a ~90-minute full-stack panel with two or three
interviewers. The candidate directs the thinking; the lead drives the screen.
Goal: see how they think across the stack. They do not build anything.

---

## Before the call (2 minutes)

```bash
cd issue-tracker
docker compose up            # wait for web + api to come up
```

- App: <http://localhost:3000>  ·  API: <http://localhost:4000/api>
- Keep a terminal tailing the API logs: `docker compose logs -f api`
- Reset to a clean state (between candidates): `docker compose exec api npm run seed`
- The **simulator** fires the webhook every ~10s so the logs are always live. Pause it
  with `docker compose stop simulator` when you want quiet; resume with `start`.
- **Scale data for Station 2:** `docker compose exec -e SEED_TICKETS=5000 api npm run seed`
  makes the board take a couple of seconds (the N+1, felt). Reset with the plain seed.
- **Station 5 (Lambda):** have `lambda/src/webhookHandler.ts` open in an editor tab ahead of
  time. It's not built or run by `docker compose` — nothing to start, just open the file when
  you get there.
- Using AI is welcome — ask them to explain and defend what it gives them.

## Who's in the room

You drive the whole session; other interviewers and observers chime in as they like.

## Timing

| Time | Station |
| --- | --- |
| 0:00–05 | Intro & tone |
| 0:05–25 | 1. Orient + trace the webhook (understanding + API) |
| 0:25–40 | 2. Data & Mongo |
| 0:40–55 | 3. API design |
| 0:55–1:10 | 4. UI |
| 1:10–20 | 5. AWS & infra (discussion) |
| 1:20–30 | Wrap, candidate Qs, panel debrief |

---

## Station 1 — Orient + trace

> "Look around the app and the code — how do you get your bearings? Then: a webhook is
> provisioning users every few seconds (see the logs). Walk me through what happens end
> to end when one fires, and where would you put a breakpoint?"

The chain (one correlation id): `webhookController.handleUserProvisioned` (checks
`x-webhook-secret`) → `userService.provisionUser` → `mailer.sendWelcomeEmail` (mock SES)
→ outbox. Results: `curl -s localhost:4000/api/outbox | jq`. Bad secret → 401.

**Strong:** orients outside-in, traces across layers, spots the secret check, names a breakpoint.

> **Follow-up (idempotency):** "Say the HR system times out waiting for our response and
> retries with the exact same payload. Trace it again — what happens?"

Answer: nothing stops it. `handleUserProvisioned` → `provisionUser` calls `User.create`
unconditionally every time; there's no unique index on `User.email` and no idempotency
key, so a retry creates a second user and sends a second welcome email. Ask how they'd fix
it — a client-supplied idempotency key, a unique index + upsert, or a dedupe table keyed
on correlation id.

**Strong:** finds the duplicate-provisioning gap without being told it's there, connects it
to the missing unique index.

## Station 2 — Data & Mongo

> **Integrity:** "Epic progress is wrong — Onboarding revamp shows more done than the
> board has, and moving/deleting tickets doesn't fix it. What's going on, how would you fix it?"

Answer: progress is cached on `Epic.stats`, only the create path updates it → drift.
Fix: derive on read, or maintain the cache on every mutation in one place.

> **Scale:** load `SEED_TICKETS=5000`, open the board (now ~2.5s). "Why is it slow?"

Answer: N+1 in `getBoard` (an epic query per ticket) + no indexes + no pagination.
Fix: `$in` / `$lookup`, add indexes, paginate. Reset with the plain seed after.

> **Modeling (optional):** "Anything in the schema you'd change?" → `assignee` is a name,
> not a ref to a user; should epic progress be stored at all.

**Strong:** connects the slow board to the query pattern; spots the assignee modeling gap.

## Station 3 — API design

> **Design:** "We want to email a user when a ticket's assigned to them. Design the
> endpoint: shape, validation, error handling, status codes, and how you'd stop double-sends."
>
> **Critique:** "Look at `ticketController.postTicket` — what would you change?"

Answer key: fat controller, inconsistent with the epic service (issue 3); only validates
title, trusts client input (issue 7); count-based key races (issue 8); no pagination (5).
The webhook returns 202 but isn't idempotent — ask how they'd dedupe retries (this echoes
Station 1's follow-up — a candidate who found the gap while tracing should design the fix here).

> **Edge cases:** "What should happen if `email` is present but malformed, or the request
> body isn't valid JSON at all? Where's the line between a 400 and a 500 here, and what
> would you actually validate with?"

Answer: today a falsy check is the only validation (`webhookController`, `postTicket`) —
a malformed email string sails through to Mongoose, and a bad JSON body would throw before
any handler code runs, landing in the generic 500 in `app.ts`'s central error handler rather
than a clean 400. Listening for: a schema validation library (zod/joi) at the boundary,
a consistent error envelope, and distinguishing client (4xx) from server (5xx) failures.

**Strong:** talks validation, idempotency, error handling unprompted; thin controller + service;
separates client-caused failures from server-caused ones without prompting.

## Station 4 — UI

> **Trace:** "How does a ticket get from the API to the screen, and what happens when you
> change its status on the board?"
>
> **Extend/critique:** "How would you add a 'my tickets' filter? Anything in the front end you'd change?"

Answer key: pages fetch via the axios client; a status change PATCHes then refetches. The
tell: the epic percent in the sidebar is computed in the component, not the server (issue 7);
statuses are duplicated FE/BE (issue 4). App is accessibility-first — a sharp candidate notices.

**Strong:** traces the data flow, knows where logic belongs, scopes a change sensibly.

## Station 5 — AWS & infra (high-level discussion)

> "The mailer is a mock and the webhook comes from a simulator. In production, how would you
> actually build and run this — where it runs, reliable webhook delivery, email at scale,
> secrets, and knowing it's healthy?"

Listening for: containers (ECS/Fargate) or Lambda + API Gateway; signature verification +
idempotency + a queue (SQS) and DLQ + retries; real SES with bounce/complaint handling;
Secrets Manager / SSM; structured logs (the correlation id), metrics, tracing, alarms;
managed Mongo (Atlas/DocumentDB) + backups + indexes.

> **Concrete (Lambda):** open `lambda/src/webhookHandler.ts` — a serverless port of the same
> webhook behind API Gateway. "What's wrong with running it this way?"

Answer key: `mongoose.connect` is called on every invocation with no connection reuse across
warm starts — under load this either exhausts Mongo's connection limit or, without the
container's connection being cached at module scope, adds a full handshake to every
invocation's latency; `JSON.parse(event.body)` is unguarded, so a malformed body throws
before any validation runs and API Gateway hands the caller a raw 502 instead of a clean 400;
it's invoked directly by API Gateway with no queue in front of it, so there's nothing to
absorb retries or a slow write — which, combined with the same missing idempotency as the
Express version, makes duplicate provisioning more likely here, not less.

**Strong:** reaches for queues, idempotency, and managed services and weighs tradeoffs;
given the Lambda file, ties the abstract answer to the actual code (connection reuse,
unguarded parsing) instead of generic "use Lambda" hand-waving.

## Close (~5–10 min)

> "What would you do next? Anything you'd cut? Questions for us?"

Observers and panel debrief after the candidate leaves.

---

## Your scorecard

Understanding code · data/DB · API design · front end · infra knowledge · communication &
judgment (incl. whether they check their AI). Score 1–4 each; no pass mark.

## Quick reference

| Action | Command |
| --- | --- |
| Start | `docker compose up` |
| App / API / logs | `localhost:3000` · `localhost:4000/api` · `docker compose logs -f api` |
| Reset data | `docker compose exec api npm run seed` |
| Scale data (Station 2) | `docker compose exec -e SEED_TICKETS=5000 api npm run seed` |
| Pause / resume traffic | `docker compose stop simulator` · `docker compose start simulator` |
| Fire one webhook by hand | `curl -X POST localhost:4000/api/webhooks/user-provisioned -H 'x-webhook-secret: dev-secret' -H 'content-type: application/json' -d '{"email":"a@example.com","name":"Ada","source":"hr"}'` |
| See users / outbox | `curl -s localhost:4000/api/users \| jq` · `curl -s localhost:4000/api/outbox \| jq` |
| Lambda file for Station 5 | `lambda/src/webhookHandler.ts` (read-only — not run by docker compose) |
