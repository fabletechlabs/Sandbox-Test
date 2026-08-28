import { Schema, model } from 'mongoose';

const epicSchema = new Schema(
  {
    key: { type: String, unique: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    color: { type: String, default: '#6b7280' },
    status: { type: String, default: 'open' },
    stats: {
      total: { type: Number, default: 0 },
      done: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

export const Epic = model('Epic', epicSchema);
