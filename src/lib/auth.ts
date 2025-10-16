// Authentication Configuration with NextAuth.js
import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GH_CLIENT_ID!,
      clientSecret: process.env.GH_CLIENT_SECRET!,
    }),
    // We'll add more providers later (Microsoft, Apple, etc.)
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      // Add user info to JWT token
      if (user) {
        token.userId = user.id
        token.tenantId = user.id // For now, user ID = tenant ID
      }
      return token
    },
    async session({ session, token }) {
      // Add user info to session
      if (token) {
        session.user.id = token.userId as string
        session.user.tenantId = token.tenantId as string
      }
      return session
    },
    async signIn({ user }) {
      // Custom sign-in logic
      console.log('User signing in:', user.email)
      return true
    },
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  events: {
    async signIn({ user, account }) {
      console.log(`User ${user.email} signed in with ${account?.provider}`)
    },
    async signOut() {
      console.log('User signed out')
    },
  },
}

// Type extensions for NextAuth
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      tenantId: string
      email: string
      name?: string
      image?: string
    }
  }
  
  interface User {
    id: string
    tenantId?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId: string
    tenantId: string
  }
}