import NextAuth from "next-auth/next"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"
import { verify } from "@/lib/hash"
import type { Adapter } from "next-auth/adapters"
import type { JWT } from "next-auth/jwt"
import type { Session } from "next-auth"

const providers: unknown[] = [
  Credentials({
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Hasło", type: "password" },
    },
    authorize: async (credentials) => {
      const email = credentials?.email?.toLowerCase().trim()
      const password = credentials?.password || ""
      if (!email || !password) return null
      const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
      if (!user) return null
      const ok = await verify(user.passwordHash, password)
      if (!ok) return null
      return { id: user.id, email: user.email, name: user.name, role: user.role }
    },
  }),
]

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/calendar.events',
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    })
  )
}

export const authOptions = {
  adapter: DrizzleAdapter(db) as unknown as Adapter,
  session: {
    strategy: "jwt",
    // Keep users signed in for a long time (2 years)
    maxAge: 60 * 60 * 24 * 365 * 2,
    // Refresh the session token cookie at most once per day
    updateAge: 60 * 60 * 24,
  },
  jwt: {
    // Match session longevity for JWT strategy
    maxAge: 60 * 60 * 24 * 365 * 2,
  },
  providers,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: unknown }) {
      if (user && typeof (user as { role?: unknown }).role === 'string') {
        (token as Record<string, unknown>).role = (user as { role: string }).role
      }
      return token
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      const role = (token as Record<string, unknown>).role
      if (session.user && typeof role === 'string') {
        (session.user as { role?: string }).role = role
      }
      // Dodaj id użytkownika do session.user, aby API mogło filtrować po installerId
      if (session.user && typeof token.sub === 'string') {
        (session.user as { id?: string }).id = token.sub
      }
      return session
    },
  },
}

// Pragmatic cast due to NextAuth types variance across versions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handler = NextAuth(authOptions as any)
export { handler as GET, handler as POST }
