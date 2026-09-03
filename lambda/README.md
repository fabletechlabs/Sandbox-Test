# Webhook lambda (discussion only)

A serverless port of `POST /api/webhooks/user-provisioned` — same contract, same
provisioning flow as `api/src/controllers/webhookController.ts`, written as it
would run behind API Gateway instead of inside the Express container.

Not built, deployed, or exercised by `docker compose up` — it exists to be read
and critiqued (Station 5), not run. `npm install && npm run typecheck` confirms
it compiles; there's no handler invocation wired up anywhere.
    