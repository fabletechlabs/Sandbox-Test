import { Request, Response } from 'express';
import { Ticket } from '../models/Ticket';
import { Epic } from '../models/Epic';
import { STATUSES } from '../constants';

/**
 * Return the board as a set of columns (one per status), each holding its
 * tickets with a little epic info attached for the card.
 */
export async function getBoard(_req: Request, res: Response) {
  const tickets = await Ticket.find().sort({ order: 1, createdAt: 1 });

  const decorated: Record<string, unknown>[] = [];
  for (const ticket of tickets) {
    let epic = null;
    if (ticket.epicId) {
      const e = await Epic.findById(ticket.epicId);
      if (e) epic = { _id: e._id, key: e.key, title: e.title, color: e.color };
    }
    decorated.push({ ...ticket.toObject(), epic });
  }

  const columns = STATUSES.map((status) => ({
    status,
    tickets: decorated.filter((t) => t.status === status),
  }));

  // Any tickets whose status isn't one of the known columns.
  const known = new Set(STATUSES);
  const others = decorated.filter((t) => !known.has(t.status as string));
  if (others.length) columns.push({ status: 'other', tickets: others });

  res.json({ columns });
}
