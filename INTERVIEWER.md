# Interviewer run-sheet — Cardboard senior exercise

Internal. This is the script for running the session live. The candidate drives the
thinking; you drive the screen. Goal: see how they understand unfamiliar code, find
their way around, communicate, and scope work. Building things is not the point.

---

## Before the call (2 minutes)

```bash
cd issue-tracker
docker compose up            # wait for web + api to come up
```

- App: <http://localhost:3000>  ·  API: <http://localhost:4000/api>
- Keep a terminal open tailing the API logs — you'll want this for Activity 1:
  ```bash
  docker compose logs -f api
  ```
- Reset to a clean state any time (between candidates, or if things get messy):
  ```bash
  docker compose exec api npm run seed
  # or, full clean slate:
  docker compose down -v && docker compose up
  ```
- A background **simulator** keeps firing the webhook (~every 10s), so there's always live
  traffic in the logs to watch — you don't have to fire anything by hand. Pause it any time
  with `docker compose stop simulator` (e.g. to quiet the logs for Activity 2 or 3), and
  bring it back with `docker compose start simulator`.
- Using AI (ChatGPT, Copilot, etc.) is welcome and realistic. When they lean on it,
  ask them to explain and defend what it gave them — that's the signal.

## The app in 20 seconds (so you can follow along)

Cardboard is a small issue tracker — epics, tickets, a board, comments — plus a Docs
wiki. Stack: Node + Express + MongoDB/Mongoose on the API, React + TypeScript on the
web. There is also one small integration flow: an **inbound webhook provisions a user
and sends a (mock SES) welcome email**. That flow is what Activity 1 traces.

---

## Activity 1 — Explore and explain (10–15 min)

**Prompt:** "Take a few minutes to look around the app and the code. How do you get your
bearings in a codebase you've never seen? Walk me through how it's put together."

Then the integration trace:

**Prompt:** "There's an inbound webhook that provisions a user. Walk me through what
happens end to end when it fires — what handles it, and where would you put a breakpoint?"

The webhook is **already firing on its own** — the simulator sends a fresh event every
~10 seconds — so the logs are always moving. Have the candidate pick one and trace it.
Each event shares a single correlation id, so a chain is easy to follow:

```
[webhook] (wh_xxx) received user-provisioned from hr-system
[users]   (wh_xxx) provisioning user ada@example.com
[mailer]  (wh_xxx) sending email to ada@example.com via SES (mock): "Welcome to Cardboard"
[users]   (wh_xxx) provisioned user ada@example.com (<id>)
[webhook] (wh_xxx) done
```

Want one clean event to point at (or to show the security check)? Fire one yourself:

```bash
curl -X POST http://localhost:4000/api/webhooks/user-provisioned \
  -H 'x-webhook-secret: dev-secret' -H 'content-type: application/json' \
  -d '{"email":"ada@example.com","name":"Ada Lovelace","source":"hr-system"}'
```

See the results:

```bash
curl -s localhost:4000/api/users  | jq   # the new user
curl -s localhost:4000/api/outbox | jq   # the "sent" welcome email
```

**Answer key (so you can follow or nudge):**
- Entry point: `api/src/controllers/webhookController.ts` → `handleUserProvisioned`.
  It checks the `x-webhook-secret` header, then calls…
- `api/src/services/userService.ts` → `provisionUser`. Creates the user, then calls…
- `api/src/services/mailer.ts` → `sendWelcomeEmail`. This is the SES stand-in; it records
  the message in the outbox instead of really sending.
- Show the security check: run the same curl with `-H 'x-webhook-secret: wrong'` → **401**.

**Strong:** orients from the outside in (runs it, follows a request through the layers),
names the layers, traces webhook → service → mailer, notices the secret check, says where
they'd breakpoint (e.g. `provisionUser` to inspect the payload) and how they'd follow the
correlation id through the logs. **Weak:** opens files at random, can't connect the webhook
to the email, hand-waves the flow.

---

## Activity 2 — Plan a feature and write the ticket (20 min) — the main event

**Prompt:** "We want to notify people when work lands on them: when a ticket is assigned to
someone, email them. Have a look at how you'd build it, then write it up as a ticket in
Cardboard — a description, acceptance criteria, and dev notes for whoever picks it up. You
don't need to build it."

They create the ticket in the app: **Board → New ticket** (there are description and
acceptance-criteria fields; dev notes can go in the description or a comment).

**What good dev notes surface (answer key):**
- Assignment happens in `api/src/controllers/ticketController.ts` → `patchTicket` (a PATCH
  that can set `assignee`).
- Sending reuses `mailer.sendEmail` — the same SES stand-in they just traced.
- **The gotcha to look for:** `assignee` is a free-text **name**, not linked to a user with
  an email. So "email the assignee" needs a way to turn a name into an email address, which
  the data model doesn't support cleanly today. A strong candidate calls this out.
- Edge cases: fire only when the assignee actually changes (not on every edit); what about
  unassignment; what if the person has no email on file.
- Acceptance criteria written as outcomes ("given/when/then"), not implementation steps.

**Strong:** gathers the real facts from the code, spots the name-vs-email gap, scopes a
sensible first slice, writes crisp outcome-based ACs. **Weak:** a vague ticket that restates
the title, misses the data-model gap, or plans to build everything at once.

_Alternative feature if you'd rather:_ "fire an outbound webhook to an external URL when a
ticket is created."

---

## Activity 3 — Diagnose a bug and write the fix ticket (10–15 min, optional)

**Prompt:** "Epic progress looks wrong — 'Onboarding revamp' says it's further along than
the board shows, and moving or deleting tickets doesn't update it. Find the cause and write
a ticket to fix it. You don't have to fix it, just scope it."

**Answer key:** epic progress is cached in `Epic.stats` and only the *create* path updates
it (`api/src/controllers/ticketController.ts`). Status changes, moving a ticket to another
epic, and deletes never adjust it, so it drifts. The seeded "Onboarding revamp" epic already
shows it. Ideal fix: derive progress on read (an aggregate/count), or maintain the cache on
every mutation through a single place. **Strong:** diagnoses the real root cause and writes a
ticket that scopes the actual fix, not just "make the number right."

---

## What you're scoring

Understanding code · exploring and finding things · communication (the write-ups) ·
judgment and scoping. Not whether they build anything. There is no pass mark — use it to
structure your written feedback.

## Quick reference

| Action | Command |
| --- | --- |
| Start | `docker compose up` |
| App / API / logs | `localhost:3000` · `localhost:4000/api` · `docker compose logs -f api` |
| Pause / resume auto-traffic | `docker compose stop simulator` · `docker compose start simulator` |
| Reset data | `docker compose exec api npm run seed` |
| Fire one webhook by hand | the `curl` in Activity 1 |
| Bad secret (should 401) | same curl with `-H 'x-webhook-secret: wrong'` |
| See users / outbox | `curl -s localhost:4000/api/users \| jq` · `curl -s localhost:4000/api/outbox \| jq` |
