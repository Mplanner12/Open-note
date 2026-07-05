import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Note from '@/models/Note';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { localDB, LocalNote } from '@/lib/dbFallback';

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  try {
    await dbConnect();
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Local JSON Database Fallback
    if (global.useLocalDB) {
      const notes = localDB.getNotes();
      const noteIndex = notes.findIndex((n) => n._id === id);
      if (noteIndex === -1) {
        return NextResponse.json({ error: 'Note not found' }, { status: 404 });
      }

      if (notes[noteIndex].authorId !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden: You can only edit your own notes' }, { status: 403 });
      }

      const body = await req.json();
      const { title, content, category, tags, visibility, isPinned, isStarred } = body;

      const updatedNote: LocalNote = {
        ...notes[noteIndex],
        title: title !== undefined ? title : notes[noteIndex].title,
        content: content !== undefined ? content : notes[noteIndex].content,
        category: category !== undefined ? category : notes[noteIndex].category,
        tags: tags !== undefined ? tags : notes[noteIndex].tags,
        visibility: visibility !== undefined ? visibility : notes[noteIndex].visibility,
        isPinned: isPinned !== undefined ? isPinned : notes[noteIndex].isPinned,
        isStarred: isStarred !== undefined ? isStarred : notes[noteIndex].isStarred,
        updatedAt: new Date().toISOString(),
      };

      notes[noteIndex] = updatedNote;
      localDB.saveNotes(notes);

      return NextResponse.json(updatedNote);
    }

    // Standard MongoDB path
    const note = await Note.findById(id);
    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    if (note.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden: You can only edit your own notes' }, { status: 403 });
    }

    const body = await req.json();
    const { title, content, category, tags, visibility, isPinned, isStarred } = body;

    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;
    if (category !== undefined) note.category = category;
    if (tags !== undefined) note.tags = tags;
    if (visibility !== undefined) note.visibility = visibility;
    if (isPinned !== undefined) note.isPinned = isPinned;
    if (isStarred !== undefined) note.isStarred = isStarred;

    await note.save();
    return NextResponse.json(note);
  } catch (error: unknown) {
    console.error('Error updating note:', error);
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    await dbConnect();
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Local JSON Database Fallback
    if (global.useLocalDB) {
      let notes = localDB.getNotes();
      const note = notes.find((n) => n._id === id);
      if (!note) {
        return NextResponse.json({ error: 'Note not found' }, { status: 404 });
      }

      if (note.authorId !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden: You can only delete your own notes' }, { status: 403 });
      }

      notes = notes.filter((n) => n._id !== id);
      localDB.saveNotes(notes);
      return NextResponse.json({ message: 'Note deleted successfully' });
    }

    // Standard MongoDB path
    const note = await Note.findById(id);
    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    if (note.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden: You can only delete your own notes' }, { status: 403 });
    }

    await Note.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Note deleted successfully' });
  } catch (error: unknown) {
    console.error('Error deleting note:', error);
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
}
