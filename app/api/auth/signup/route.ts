import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User, { hashPassword } from '@/models/User';
import { localDB } from '@/lib/dbFallback';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { username, password, role } = await req.json();

    if (!username || !password || !role) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    const sanitizedUsername = username.trim().toLowerCase();

    // Fallback if MongoDB is unreachable
    if (global.useLocalDB) {
      const users = localDB.getUsers();
      const existingUser = users.find((u) => u.username === sanitizedUsername);
      if (existingUser) {
        return NextResponse.json({ error: 'Username or email already exists.' }, { status: 400 });
      }

      const passwordHash = hashPassword(password);
      const newUser = {
        _id: 'user-' + Math.random().toString(36).substring(2, 11),
        username: sanitizedUsername,
        passwordHash,
        role: role as 'developer' | 'designer' | 'writer' | 'manager',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      localDB.saveUsers([...users, newUser]);

      return NextResponse.json({
        message: 'Account created successfully.',
        user: {
          id: newUser._id,
          username: newUser.username,
          role: newUser.role,
        },
      });
    }

    // Check if user already exists in MongoDB
    const existingUser = await User.findOne({ username: sanitizedUsername });
    if (existingUser) {
      return NextResponse.json({ error: 'Username or email already exists.' }, { status: 400 });
    }

    // Hash password
    const passwordHash = hashPassword(password);

    // Create user in MongoDB
    const newUser = await User.create({
      username: sanitizedUsername,
      passwordHash,
      role: role as 'developer' | 'designer' | 'writer' | 'manager',
    });

    return NextResponse.json({
      message: 'Account created successfully.',
      user: {
        id: newUser._id,
        username: newUser.username,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
