import { Schema, model } from 'mongoose';

const userSchema = new Schema(
  {
    name: { type: String, default: '' },
    email: { type: String, required: true },
    status: { type: String, default: 'invited' },
    source: { type: String, default: '' },
  },
  { timestamps: true }
);

export const User = model('User', userSchema);
