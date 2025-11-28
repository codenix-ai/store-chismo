// lib/auth.ts
import type { NextAuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: { email: {}, password: { type: 'password' } },
      async authorize(credentials) {
        const res = await fetch(`${process.env.API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: credentials?.email,
            password: credentials?.password,
          }),
        });

        if (!res.ok) return null; // => 401 from NextAuth
        const data = await res.json();
        console.log('BACKEND STATUS:', res.status);
        console.log('BACKEND RESPONSE:', JSON.stringify(data).slice(0, 500));

        // MUST return an object with id
        if (!data?.accessToken) return null;

        return {
          id: String(data.id),
          name: data.name,
          email: data.email,
          role: data.role,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken ?? null,
          accessTokenExpires: Date.now() + (data.expiresIn ?? 3600) * 1000,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
        token.accessToken = (user as any).accessToken;
        token.refreshToken = (user as any).refreshToken;
        token.accessTokenExpires = (user as any).accessTokenExpires;
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).user.id = token.id;
      (session as any).user.role = token.role;
      (session as any).accessToken = token.accessToken;
      (session as any).accessTokenExpires = token.accessTokenExpires;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
