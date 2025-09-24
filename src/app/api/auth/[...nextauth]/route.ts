import NextAuth from "next-auth/next"
import Credentials from "next-auth/providers/credentials"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"
import { verify } from "@/lib/hash"
import type { Adapter } from "next-auth/adapters"
import type { JWT } from "next-auth/jwt"
import type { Session } from "next-auth"

export const authOptions = {
  adapter: DrizzleAdapter(db) as unknown as Adapter,
  session: { strategy: "jwt" },
  providers: [
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
  ],
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
      return session
    },
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
