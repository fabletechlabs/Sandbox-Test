import { Request, Response } from 'express';
import { config } from '../config';
import { provisionUser } from '../services/userService';

/**
 * Inbound webhook. An external system (say an HR tool or identity provider)
 * calls this to tell us to provision a user. We verify a shared secret, create
 * the user, and trigger a welcome email:
 *   webhook -> provisionUser -> sendWelcomeEmail (mock SES) -> outbox
 * Each hop logs a line tagged with the same correlation id.
 */
export async function handleUserProvisioned(req: Request, res: Response) {
  const correlationId = `wh_${Date.now().toString(36)}`;
  console.log(`[webhook] (${correlationId}) received user-provisioned from ${req.body?.source || 'unknown'}`);

  const secret = req.header('x-webhook-secret');
  if (secret !== config.webhookSecret) {
    console.warn(`[webhook] (${correlationId}) rejected: invalid secret`);
    return res.status(401).json({ error: 'Invalid webhook secret' });
  }

  const { email, name, source } = req.body || {};
  if (!email) {
    return res.status(400).json({ error: 'email is required' });
  }

  const user = await provisionUser({ email, name, source }, correlationId);

  console.log(`[webhook] (${correlationId}) done`);
  res.status(202).json({ ok: true, correlationId, userId: user._id });
}
