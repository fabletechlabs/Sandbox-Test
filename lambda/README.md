# Webhook lambda

A serverless port of `POST /api/webhooks/user-provisioned` — same contract, same
provisioning flow as `api/src/controllers/webhookController.ts`, written as it
would run behind API Gateway instead of inside the Express container.

Not built, deployed, or run by `docker compose up`. `npm install && npm run
typecheck` confirms it compiles; there's no handler invocation wired up anywhere.
    