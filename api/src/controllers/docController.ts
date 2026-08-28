import { Request, Response } from 'express';
import { Doc, generateUniqueSlug } from '../models/Doc';

/**
 * List all docs, most recently updated first.
 */
export async function listDocs(_req: Request, res: Response) {
  const docs = await Doc.find().sort({ updatedAt: -1 });
  res.json(docs);
}

/**
 * Get a single doc by its slug.
 */
export async function getDoc(req: Request, res: Response) {
  const doc = await Doc.findOne({ slug: req.params.slug });
  if (!doc) return res.status(404).json({ error: 'Doc not found' });
  res.json({ doc });
}

/**
 * Create a doc, generating a unique slug from its title.
 */
export async function postDoc(req: Request, res: Response) {
  if (!req.body.title) return res.status(400).json({ error: 'title is required' });

  const slug = await generateUniqueSlug(req.body.title);
  const doc = await Doc.create({
    slug,
    title: req.body.title,
    body: req.body.body || '',
  });

  res.status(201).json(doc);
}

/**
 * Update a doc's title and/or body.
 */
export async function patchDoc(req: Request, res: Response) {
  const update: Record<string, unknown> = {};
  if ('title' in req.body) update.title = req.body.title;
  if ('body' in req.body) update.body = req.body.body;

  const doc = await Doc.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!doc) return res.status(404).json({ error: 'Doc not found' });
  res.json(doc);
}

/**
 * Delete a doc.
 */
export async function deleteDoc(req: Request, res: Response) {
  const doc = await Doc.findByIdAndDelete(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Doc not found' });
  res.json({ ok: true });
}
