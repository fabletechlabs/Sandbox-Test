import { Epic } from '../models/Epic';

interface CreateEpicInput {
  title: string;
  description?: string;
  color?: string;
}

/**
 * Create a new epic with a generated key.
 * @param input - Epic fields from the request.
 * @return The created epic document.
 */
export async function createEpic(input: CreateEpicInput) {
  const count = await Epic.countDocuments();
  const epic = await Epic.create({
    key: `EPIC-${count + 1}`,
    title: input.title,
    description: input.description || '',
    color: input.color || '#6b7280',
    stats: { total: 0, done: 0 },
  });
  return epic;
}

/**
 * Update an epic's editable fields.
 * @param id - Epic id.
 * @param patch - Partial epic fields.
 * @return The updated epic document, or null if not found.
 */
export async function updateEpic(id: string, patch: Record<string, unknown>) {
  const allowed = ['title', 'description', 'color', 'status'];
  const update: Record<string, unknown> = {};
  for (const field of allowed) {
    if (field in patch) update[field] = patch[field];
  }
  return Epic.findByIdAndUpdate(id, update, { new: true });
}
