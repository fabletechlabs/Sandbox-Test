import { Schema, model } from 'mongoose';

const docSchema = new Schema(
  {
    slug: { type: String, unique: true },
    title: { type: String, required: true },
    body: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Doc = model('Doc', docSchema);

/**
 * Convert a title into a lowercase, hyphen-separated slug base.
 * @param title - The doc title to slugify.
 * @return A URL-safe kebab-case string, falling back to 'doc' if the title has no usable characters.
 */
function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || 'doc';
}

/**
 * Generate a unique slug for a doc title, appending -2, -3, etc. on collision
 * with an existing doc's slug.
 * @param title - The doc title to derive the slug from.
 * @return A slug guaranteed not to collide with an existing doc.
 */
export async function generateUniqueSlug(title: string): Promise<string> {
  const base = slugify(title);
  let slug = base;
  let suffix = 2;
  while (await Doc.exists({ slug })) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
}
