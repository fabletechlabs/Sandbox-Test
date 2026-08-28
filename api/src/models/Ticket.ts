import { Schema, model } from 'mongoose';

const ticketSchema = new Schema(
  {
    key: { type: String, unique: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    acceptanceCriteria: { type: String, default: '' },
    type: { type: String, default: 'task' },
    status: { type: String, default: 'backlog' },
    estimate: { type: Number, default: 0 },
    epicId: { type: Schema.Types.ObjectId, ref: 'Epic', default: null },
    assignee: { type: String, default: '' },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Ticket = model('Ticket', ticketSchema);
