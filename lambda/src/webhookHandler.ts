import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import mongoose from 'mongoose';

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'dev-secret';
const MONGODB_URI = process.env.MONGODB_URI || '';

const User =
  mongoose.models.User ||
  mongoose.model(
    'User',
    new mongoose.Schema(
      {
        name: { type: String, default: '' },
        email: { type: String, required: true },
        status: { type: String, default: 'invited' },
        source: { type: String, default: '' },
      },
      { timestamps: true }
    )
  );

const Email =
  mongoose.models.Email ||
  mongoose.model(
    'Email',
    new mongoose.Schema(
      {
        to: String,
        subject: String,
        body: String,
        provider: String,
        correlationId: String,
      },
      { timestamps: true }
    )
  );

/**
 * Serverless port of POST /api/webhooks/user-provisioned, fronted directly by
 * API Gateway. Same contract and the same provisioning flow as the Express
 * version in api/src/controllers/webhookController.ts — kept here so the two
 * can be compared: what changes when this runs as a Lambda instead of inside
 * the long-lived container.
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const correlationId = `wh_${Date.now().toString(36)}`;

  await mongoose.connect(MONGODB_URI);

  const secret = event.headers['x-webhook-secret'];
  if (secret !== WEBHOOK_SECRET) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Invalid webhook secret' }) };
  }

  const { email, name, source } = JSON.parse(event.body || '{}');
  if (!email) {
    return { statusCode: 400, body: JSON.stringify({ error: 'email is required' }) };
  }

  const user = await User.create({ email, name: name || '', source: source || '', status: 'invited' });
  await Email.create({
    to: user.email,
    subject: 'Welcome to Cardboard',
    body: `Hi ${user.name || 'there'}, your Cardboard account is ready. Log in to get started.`,
    provider: 'ses-mock',
    correlationId,
  });

  return { statusCode: 202, body: JSON.stringify({ ok: true, correlationId, userId: user._id }) };
}
