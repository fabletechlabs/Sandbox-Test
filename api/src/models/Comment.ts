import { Schema, model } from 'mongoose';

const commentSchema = new Schema(
  {
    ticketId: { type: Schema.Types.ObjectId, ref: 'Ticket', required: true },
    author: { type: String, default: 'Anonymous' },
    body: { type: String, required: true },
  },
  { timestamps: true }
);

export const Comment = model('Comment', commentSchema);
