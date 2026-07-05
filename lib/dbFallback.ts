import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'local_db.json');

export interface LocalUser {
  _id: string;
  username: string;
  passwordHash: string;
  role: 'developer' | 'designer' | 'writer' | 'manager';
  createdAt: string;
  updatedAt: string;
}

export interface LocalNote {
  _id: string;
  title: string;
  content: string;
  category: 'Engineering' | 'Design' | 'Product' | 'Marketing' | 'Personal' | 'General';
  tags: string[];
  isPinned: boolean;
  isStarred: boolean;
  visibility: 'private' | 'shared';
  authorName: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

interface LocalDBStructure {
  users: LocalUser[];
  notes: LocalNote[];
}

function getDB(): LocalDBStructure {
  try {
    if (!fs.existsSync(DB_PATH)) {
      const initial: LocalDBStructure = {
        users: [
          {
            _id: 'user-alex',
            username: 'alex@example.com',
            passwordHash: 'e6a8e8b6b27e8d35f6063b51b3a4a9c6:d6d37651a2d5f0e9b987c2b5e282c02cbb3e8f7a6c9d7e0f2a91', // salt:hash of 'password'
            role: 'developer',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        ],
        notes: [
          {
            _id: 'note-default-1',
            title: 'Getting Started',
            content: '# Welcome to Open Note!\n\nThis note is stored in your local fallback database. You can edit it, add tags, or create new ones.',
            category: 'General',
            tags: ['getting-started', 'local'],
            isPinned: true,
            isStarred: true,
            visibility: 'private',
            authorName: 'alex@example.com',
            authorId: 'user-alex',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        ],
      };
      fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
      return initial;
    }
    const content = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(content);
  } catch {
    return { users: [], notes: [] };
  }
}

function saveDB(db: LocalDBStructure) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  } catch (e) {
    console.error('Failed to write JSON local database file:', e);
  }
}

export const localDB = {
  getUsers: (): LocalUser[] => {
    return getDB().users;
  },
  saveUsers: (users: LocalUser[]) => {
    const db = getDB();
    db.users = users;
    saveDB(db);
  },
  getNotes: (): LocalNote[] => {
    return getDB().notes;
  },
  saveNotes: (notes: LocalNote[]) => {
    const db = getDB();
    db.notes = notes;
    saveDB(db);
  }
};
