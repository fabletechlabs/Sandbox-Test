import { Schema, model } from 'mongoose';

// The "outbox": a record of every email the app tried to send. In a real app
// these would go out through a provider like Amazon SES; here they are just
// stored so the flow can be inspected.
const emailSchema = new Schema(
  {
    to: { type: String, required: true },
    subject: { type: String, default: '' },
    body: { type: String, default: '' },
    provider: { type: String, default: 'ses-mock' },
    correlationId: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Email = model('Email', emailSchema);
