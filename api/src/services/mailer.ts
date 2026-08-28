import { Email } from '../models/Email';

interface EmailInput {
  to: string;
  subject: string;
  body: string;
}

/**
 * Send an email. This is a mock provider standing in for something like Amazon
 * SES: instead of actually sending, it records the message in the outbox so the
 * end-to-end flow can be traced and inspected.
 * @param input - The email to "send".
 * @param correlationId - Id threaded through the request for tracing.
 * @return The stored email record.
 */
export async function sendEmail(input: EmailInput, correlationId = '-') {
  console.log(`[mailer] (${correlationId}) sending email to ${input.to} via SES (mock): "${input.subject}"`);
  return Email.create({ ...input, provider: 'ses-mock', correlationId });
}

/**
 * Send the welcome email a newly provisioned user receives.
 * @param user - The user to greet.
 * @param correlationId - Id threaded through the request for tracing.
 * @return The stored email record.
 */
export async function sendWelcomeEmail(user: { name: string; email: string }, correlationId = '-') {
  return sendEmail(
    {
      to: user.email,
      subject: 'Welcome to Cardboard',
      body: `Hi ${user.name || 'there'}, your Cardboard account is ready. Log in to get started.`,
    },
    correlationId
  );
}
