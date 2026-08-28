import { Schema, model } from 'mongoose';

const memberSchema = new Schema({
  name: { type: String, required: true },
  role: { type: String, default: 'Engineer' },
});

export const Member = model('Member', memberSchema);
