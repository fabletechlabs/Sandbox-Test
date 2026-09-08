import { Request, Response } from 'express';
import { Ticket } from '../models/Ticket';
import { seed } from '../seed';

// The large dataset size, big enough for the board to feel slow.
const LARGE = 5000;

/**
 * Reseed the database with a large ticket set (for load/performance demos).
 */
export async function seedLarge(_req: Request, res: Response) {
  await seed(LARGE);
  const tickets = await Ticket.countDocuments();
  res.json({ ok: true, tickets });
}

/**
 * Reseed back to the curated sample data.
 */
export async function resetData(_req: Request, res: Response) {
  await seed(0);
  const tickets = await Ticket.countDocuments();
  res.json({ ok: true, tickets });
}

/**
 * Current ticket count, for the tools page to display.
 */
export async function stats(_req: Request, res: Response) {
  const tickets = await Ticket.countDocuments();
  res.json({ tickets });
}
