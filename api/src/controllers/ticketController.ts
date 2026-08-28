import { Request, Response } from 'express';
import { Ticket } from '../models/Ticket';
import { Epic } from '../models/Epic';
import { Comment } from '../models/Comment';

/**
 * List tickets, optionally filtered by status and/or epic.
 */
export async function listTickets(req: Request, res: Response) {
  const filter: Record<string, unknown> = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.epicId) filter.epicId = req.query.epicId;

  const tickets = await Ticket.find(filter).sort({ order: 1, createdAt: 1 });
  res.json(tickets);
}

/**
 * Get a single ticket with its epic and comments.
 */
export async function getTicket(req: Request, res: Response) {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  const epic = ticket.epicId ? await Epic.findById(ticket.epicId) : null;
  const comments = await Comment.find({ ticketId: ticket._id }).sort({ createdAt: 1 });
  res.json({ ticket, epic, comments });
}

/**
 * Create a ticket. Generates a key, saves it, and rolls the new ticket into
 * its epic's cached stats.
 */
export async function postTicket(req: Request, res: Response) {
  if (!req.body.title) return res.status(400).json({ error: 'title is required' });

  const count = await Ticket.countDocuments();
  const ticket = await Ticket.create({
    key: `CARD-${count + 1}`,
    title: req.body.title,
    description: req.body.description || '',
    acceptanceCriteria: req.body.acceptanceCriteria || '',
    type: req.body.type || 'task',
    status: req.body.status || 'backlog',
    estimate: req.body.estimate || 0,
    epicId: req.body.epicId || null,
    assignee: req.body.assignee || '',
    order: req.body.order || 0,
  });

  if (ticket.epicId) {
    const inc: Record<string, number> = { 'stats.total': 1 };
    if (ticket.status === 'done') inc['stats.done'] = 1;
    await Epic.findByIdAndUpdate(ticket.epicId, { $inc: inc });
  }

  res.status(201).json(ticket);
}

/**
 * Update a ticket's fields (including moving it between statuses).
 */
export async function patchTicket(req: Request, res: Response) {
  const ticket = await Ticket.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  res.json(ticket);
}

/**
 * Delete a ticket and its comments.
 */
export async function deleteTicket(req: Request, res: Response) {
  const ticket = await Ticket.findByIdAndDelete(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  await Comment.deleteMany({ ticketId: ticket._id });
  res.json({ ok: true });
}

/**
 * Persist a new ordering (and optionally status) for a set of tickets,
 * e.g. after a drag-and-drop on the board.
 */
export async function reorderTickets(req: Request, res: Response) {
  const items: { id: string; order: number; status?: string }[] = req.body.items || [];
  for (const item of items) {
    const update: Record<string, unknown> = { order: item.order };
    if (item.status) update.status = item.status;
    await Ticket.findByIdAndUpdate(item.id, update);
  }
  res.json({ ok: true });
}

/**
 * Add a comment to a ticket.
 */
export async function postComment(req: Request, res: Response) {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  const comment = await Comment.create({
    ticketId: ticket._id,
    author: req.body.author || 'Anonymous',
    body: req.body.body,
  });
  res.status(201).json(comment);
}
