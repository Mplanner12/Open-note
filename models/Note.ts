import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INote extends Document {
  title: string;
  content: string;
  category: 'Engineering' | 'Design' | 'Product' | 'Marketing' | 'Personal' | 'General';
  tags: string[];
  isPinned: boolean;
  isStarred: boolean;
  visibility: 'private' | 'shared';
  authorName: string;
  authorId: string;
  orgId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema = new Schema<INote>(
  {
    title: { type: String, default: 'Untitled' },
    content: { type: String, required: true },
    category: {
      type: String,
      enum: ['Engineering', 'Design', 'Product', 'Marketing', 'Personal', 'General'],
      default: 'General',
    },
    tags: [{ type: String }],
    isPinned: { type: Boolean, default: false },
    isStarred: { type: Boolean, default: false },
    visibility: { type: String, enum: ['private', 'shared'], default: 'private' },
    authorName: { type: String, required: true },
    authorId: { type: String, required: true },
    orgId: { type: String },
  },
  {
    timestamps: true,
  }
);

// Add a text index for searching
NoteSchema.index({ title: 'text', content: 'text', tags: 'text' });

const Note: Model<INote> = mongoose.models.Note || mongoose.model<INote>('Note', NoteSchema);

export default Note;
