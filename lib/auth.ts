import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import connectDB from '@/lib/mongodb';
import User, { hashPassword, verifyPassword } from '@/models/User';
import { localDB } from '@/lib/dbFallback';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Open Note Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;
        
        await connectDB();
        const username = credentials.username.trim().toLowerCase();

        // Special guest login handler (temporary session)
        if (username === 'guest@example.com' && credentials.password === 'guest-password') {
          return {
            id: 'user-guest',
            name: 'Guest User',
            role: 'writer',
          };
        }

        // Fallback if MongoDB is unreachable
        if (global.useLocalDB) {
          const users = localDB.getUsers();
          const user = users.find((u) => u.username === username);
          if (!user) return null;

          const isValid = verifyPassword(credentials.password, user.passwordHash);
          if (!isValid) return null;

          return {
            id: user._id,
            name: user.username,
            role: user.role,
            orgId: user.orgId,
          };
        }

        // Auto-seed sandbox users if database is empty for seamless testing
        const count = await User.countDocuments();
        if (count === 0) {
          const defaultUsers: {
            username: string;
            password: string;
            role: 'developer' | 'designer' | 'writer' | 'manager';
          }[] = [
            { username: 'alex@example.com', password: 'password', role: 'developer' },
            { username: 'emma@example.com', password: 'password', role: 'designer' },
            { username: 'sarah@example.com', password: 'password', role: 'writer' },
          ];
          for (const u of defaultUsers) {
            await User.create({
              username: u.username,
              passwordHash: hashPassword(u.password),
              role: u.role,
            });
          }
        }

        const user = await User.findOne({ username });
        if (!user) return null;

        const isValid = verifyPassword(credentials.password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user._id.toString(),
          name: user.username,
          role: user.role,
          orgId: user.orgId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.orgId = user.orgId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.orgId = token.orgId as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
