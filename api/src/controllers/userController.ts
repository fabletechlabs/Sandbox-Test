import { Request, Response } from 'express';
import { User } from '../models/User';
import { Email } from '../models/Email';

/**
 * List provisioned users, newest first.
 */
export async function listUsers(_req: Request, res: Response) {
  const users = await User.find().sort({ createdAt: -1 });
  res.json(users);
}

/**
 * List the outbox: every email the app has "sent", newest first.
 */
export async function listOutbox(_req: Request, res: Response) {
  const emails = await Email.find().sort({ createdAt: -1 });
  res.json(emails);
}
