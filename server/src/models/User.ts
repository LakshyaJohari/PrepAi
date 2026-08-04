import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password?: string; // Optional because users might be registered via OAuth in the future
  username: string;
  streak: number;
  best_streak: number;
  last_solved: string;
  is_admin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    username: { type: String, required: true },
    streak: { type: Number, default: 0 },
    best_streak: { type: Number, default: 0 },
    last_solved: { type: String, default: '' },
    is_admin: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);
