import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Note from '@/models/Note';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { localDB } from '@/lib/dbFallback';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'my-notes';
    const q = searchParams.get('q');
    const category = searchParams.get('category');
    const sort = searchParams.get('sort') || 'newest';

    // Local JSON Database Fallback
    if (global.useLocalDB) {
      let notes = localDB.getNotes();

      // Filter by type
      if (type === 'knowledge-base') {
        notes = notes.filter((n) => {
          if (session.user.orgId) {
            return n.visibility === 'shared' && n.orgId === session.user.orgId;
          }
          return n.visibility === 'shared' && !n.orgId;
        });
      } else {
        notes = notes.filter((n) => n.authorId === session.user.id);
      }

      // Filter by category
      if (category && category !== 'All') {
        notes = notes.filter((n) => n.category === category);
      }

      // Search filter
      if (q) {
        const queryTerm = q.toLowerCase();
        notes = notes.filter(
          (n) =>
            n.title.toLowerCase().includes(queryTerm) ||
            n.content.toLowerCase().includes(queryTerm) ||
            n.tags.some((t) => t.toLowerCase().includes(queryTerm))
        );
      }

      // Sort
      notes.sort((a, b) => {
        if (sort === 'oldest') {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        } else if (sort === 'alphabetical') {
          return a.title.localeCompare(b.title);
        } else {
          // 'newest'
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
      });

      return NextResponse.json(notes);
    }

    // Standard MongoDB path
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};

    if (type === 'knowledge-base') {
      query.visibility = 'shared';
      if (session.user.orgId) {
        query.orgId = session.user.orgId;
      } else {
        query.$or = [{ orgId: { $exists: false } }, { orgId: null }];
      }
    } else {
      query.authorId = session.user.id;
    }

    if (q) {
      const escapedQ = q.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      query.$or = [
        { title: { $regex: escapedQ, $options: 'i' } },
        { content: { $regex: escapedQ, $options: 'i' } },
        { tags: { $in: [new RegExp(escapedQ, 'i')] } },
      ];
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let sortObj: any = { createdAt: -1 };
    if (sort === 'oldest') {
      sortObj = { createdAt: 1 };
    } else if (sort === 'alphabetical') {
      sortObj = { title: 1 };
    }

    const notes = await Note.find(query).sort(sortObj);
    return NextResponse.json(notes);
  } catch (error: unknown) {
    console.error('Error fetching notes:', error);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, content, category, tags, visibility, isPinned, isStarred } = body;

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Local JSON Database Fallback
    if (global.useLocalDB) {
      const notes = localDB.getNotes();
      const newNote = {
        _id: 'note-' + Math.random().toString(36).substring(2, 11),
        title: title || 'Untitled',
        content,
        category: category || 'General',
        tags: tags || [],
        visibility: visibility || 'private',
        isPinned: isPinned || false,
        isStarred: isStarred || false,
        authorName: session.user.name || 'Unknown User',
        authorId: session.user.id,
        orgId: session.user.orgId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      localDB.saveNotes([newNote, ...notes]);
      return NextResponse.json(newNote, { status: 201 });
    }

    // Standard MongoDB path
    const note = await Note.create({
      title: title || 'Untitled',
      content,
      category: category || 'General',
      tags: tags || [],
      visibility: visibility || 'private',
      isPinned: isPinned || false,
      isStarred: isStarred || false,
      authorName: session.user.name || 'Unknown User',
      authorId: session.user.id,
      orgId: session.user.orgId,
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating note:', error);
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}
