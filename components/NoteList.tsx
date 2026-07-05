'use client';

import React from 'react';
import { Pin, Star, Lock, Globe2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export interface NoteItem {
  _id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  isPinned: boolean;
  isStarred: boolean;
  visibility: 'private' | 'shared';
  authorName: string;
  authorId: string;
  updatedAt: string;
  createdAt: string;
}

interface NoteListProps {
  notes: NoteItem[];
  selectedNoteId?: string;
  onSelectNote: (note: NoteItem) => void;
  currentUserId?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  Engineering: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30',
  Design:      'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30',
  Product:     'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/30',
  Marketing:   'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/30',
  Personal:    'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30',
  General:     'text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900',
};

export default function NoteList({ notes, selectedNoteId, onSelectNote, currentUserId }: NoteListProps) {
  if (notes.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <p className="text-sm text-zinc-500 dark:text-zinc-500">No notes found</p>
        <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-0.5">Try adjusting your search or filters</p>
      </div>
    );
  }

  const pinnedNotes = notes.filter((n) => n.isPinned);
  const otherNotes  = notes.filter((n) => !n.isPinned);

  const renderNote = (note: NoteItem) => {
    const isSelected = selectedNoteId === note._id;
    const isOwner    = currentUserId === note.authorId;
    const date       = formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true });
    const catStyle   = CATEGORY_COLORS[note.category] ?? CATEGORY_COLORS.General;

    return (
      <div
        key={note._id}
        onClick={() => onSelectNote(note)}
        className={`group relative flex flex-col gap-1.5 px-4 py-3 cursor-pointer transition-colors border-b last:border-b-0 ${
          isSelected
            ? 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
            : 'bg-transparent border-zinc-100 dark:border-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-900/60'
        }`}
      >
        {/* Title row */}
        <div className="flex items-center justify-between gap-2">
          <h3 className={`font-medium text-sm line-clamp-1 flex-1 leading-tight ${
            isSelected ? 'text-zinc-900 dark:text-white' : 'text-zinc-800 dark:text-zinc-200'
          }`}>
            {note.title || 'Untitled'}
          </h3>
          <div className="flex items-center gap-1 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
            {note.isPinned   && <Pin    className="h-3 w-3 text-emerald-500" />}
            {note.isStarred  && <Star   className="h-3 w-3 text-amber-400" />}
            {note.visibility === 'shared'
              ? <Globe2 className="h-3 w-3 text-blue-400" />
              : <Lock   className="h-3 w-3 text-zinc-300 dark:text-zinc-700" />
            }
          </div>
        </div>

        {/* Content preview */}
        <p className="text-xs text-zinc-400 dark:text-zinc-500 line-clamp-1 leading-relaxed">
          {note.content || 'No content'}
        </p>

        {/* Footer: category + date */}
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <span className={`inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded ${catStyle}`}>
            {note.category}
          </span>
          <div className="flex items-center gap-2 text-[10px] text-zinc-400 dark:text-zinc-600">
            {note.tags.slice(0, 2).map((t) => (
              <span key={t} className="text-zinc-400 dark:text-zinc-600">#{t}</span>
            ))}
            {note.tags.length > 2 && <span>+{note.tags.length - 2}</span>}
            <span className="text-zinc-300 dark:text-zinc-700">·</span>
            <span>{date}</span>
            <span className="text-zinc-300 dark:text-zinc-700">·</span>
            <span>{isOwner ? 'You' : note.authorName}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      {pinnedNotes.length > 0 && (
        <div>
          <div className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-600 flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-900">
            <Pin className="h-2.5 w-2.5" />
            Pinned
          </div>
          {pinnedNotes.map(renderNote)}
        </div>
      )}

      {otherNotes.length > 0 && (
        <div>
          {pinnedNotes.length > 0 && (
            <div className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-600 border-b border-zinc-100 dark:border-zinc-900">
              All Notes
            </div>
          )}
          {otherNotes.map(renderNote)}
        </div>
      )}
    </div>
  );
}
