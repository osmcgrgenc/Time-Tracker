import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { RedisSession } from '@/lib/redis'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null
          }

          const { email, password } = loginSchema.parse(credentials)

          // Find user
          const user = await db.user.findUnique({
            where: { email },
          })

          if (!user || !user.hashedPassword) {
            return null
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(password, user.hashedPassword)

          if (!isValidPassword) {
            return null
          }

          // Return user object
          return {
            id: user.id,
            email: user.email,
            name: user.name || user.email.split('@')[0], // Use email prefix if name is null
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  events: {
    async signIn({ user }) {
      // Store session in Redis when user signs in
      if (user.id) {
        await RedisSession.set(user.id, {
          userId: user.id,
          email: user.email,
          name: user.name,
          signedInAt: new Date().toISOString(),
        });
      }
    },
    async signOut({ token }) {
      // Remove session from Redis when user signs out
      if (token?.userId) {
        await RedisSession.delete(token.userId as string);
      }
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id
        token.email = user.email
        token.name = user.name
        
        // Update Redis session on token refresh
        await RedisSession.set(user.id, {
          userId: user.id,
          email: user.email,
          name: user.name,
          lastActivity: new Date().toISOString(),
        });
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.userId as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        
        // Verify session exists in Redis
        const redisSession = await RedisSession.get(token.userId as string);
        if (!redisSession) {
          // Session expired or doesn't exist in Redis
          throw new Error('Session expired');
        }
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }