import mongoose, { Schema, Document, Model } from 'mongoose';
import crypto from 'crypto';

export interface IUser extends Document {
  username: string;
  passwordHash: string;
  role: 'developer' | 'designer' | 'writer' | 'manager' | 'founder';
  orgId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, originalHash] = storedHash.split(':');
  if (!salt || !originalHash) return false;
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === originalHash;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['developer', 'designer', 'writer', 'manager', 'founder'], default: 'developer' },
    orgId: { type: String },
  },
  {
    timestamps: true,
  }
);

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
