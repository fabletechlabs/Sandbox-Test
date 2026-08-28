import { User } from '../models/User';
import { sendWelcomeEmail } from './mailer';

interface ProvisionInput {
  email: string;
  name?: string;
  source?: string;
}

/**
 * Provision a new user: create the record, then send them a welcome email.
 * This is the core of the end-to-end flow the exercise traces.
 * @param input - Email, and optionally a name and the source system.
 * @param correlationId - Id threaded through the request for tracing.
 * @return The created user document.
 */
export async function provisionUser(input: ProvisionInput, correlationId = '-') {
  console.log(`[users] (${correlationId}) provisioning user ${input.email}`);

  const user = await User.create({
    email: input.email,
    name: input.name || '',
    source: input.source || '',
    status: 'invited',
  });

  await sendWelcomeEmail({ name: user.name as string, email: user.email as string }, correlationId);

  console.log(`[users] (${correlationId}) provisioned user ${input.email} (${user._id})`);
  return user;
}
