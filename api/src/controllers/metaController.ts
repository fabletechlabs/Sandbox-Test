import { Request, Response } from 'express';
import { Member } from '../models/Member';
import { STATUSES, TYPES } from '../constants';

/**
 * List team members (used for assignee dropdowns).
 */
export async function listMembers(_req: Request, res: Response) {
  const members = await Member.find().sort({ name: 1 });
  res.json(members);
}

/**
 * Expose the known statuses and types.
 */
export async function getMeta(_req: Request, res: Response) {
  res.json({ statuses: STATUSES, types: TYPES });
}

/**
 * Health check.
 */
export function getHealth(_req: Request, res: Response) {
  res.json({ status: 'ok' });
}
