import { Request, Response } from 'express';
import { Epic } from '../models/Epic';
import { Ticket } from '../models/Ticket';
import { createEpic, updateEpic } from '../services/epicService';

/**
 * List all epics, each with a live progress percentage.
 */
export async function listEpics(_req: Request, res: Response) {
  const epics = await Epic.find().sort({ key: 1 });

  const result = [];
  for (const epic of epics) {
    const tickets = await Ticket.find({ epicId: epic._id });
    const done = tickets.filter((t) => t.status === 'done').length;
    const progress = tickets.length ? Math.round((done / tickets.length) * 100) : 0;
    result.push({ ...epic.toObject(), progress });
  }

  res.json(result);
}

/**
 * Get a single epic and its tickets.
 */
export async function getEpic(req: Request, res: Response) {
  const epic = await Epic.findById(req.params.id);
  if (!epic) return res.status(404).json({ error: 'Epic not found' });

  const tickets = await Ticket.find({ epicId: epic._id }).sort({ order: 1 });
  res.json({ epic, tickets });
}

/**
 * Create an epic.
 */
export async function postEpic(req: Request, res: Response) {
  if (!req.body.title) return res.status(400).json({ error: 'title is required' });
  const epic = await createEpic(req.body);
  res.status(201).json(epic);
}

/**
 * Update an epic.
 */
export async function patchEpic(req: Request, res: Response) {
  const epic = await updateEpic(req.params.id, req.body);
  if (!epic) return res.status(404).json({ error: 'Epic not found' });
  res.json(epic);
}
