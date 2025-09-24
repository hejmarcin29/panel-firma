import NextAuth, { type NextAuthOptions } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"
import { verify } from "@/lib/hash"

// Lightweight augmentation: only add optional role to JWT & Session user without redefining adapter user shape.
declare module 'next-auth' {
  interface Session { user: { id?: string; email?: string; name?: string | null; role?: string } }
  interface JWT { role?: string }
}

export const authOptions: NextAuthOptions = {
  // Cast adapter to silence structural mismatch (role field handled separately in callbacks)
  adapter: DrizzleAdapter(db) as unknown as NextAuthOptions['adapter'],
  session: { strategy: "jwt" as const },
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
    async jwt({ token, user }) {
      const hasRole = (u: unknown): u is { role: string } => typeof u === 'object' && u !== null && 'role' in u && typeof (u as { role?: unknown }).role === 'string';
      if (user && hasRole(user)) token.role = user.role;
      return token
    },
    async session({ session, token }) {
      if (session.user && typeof token.role === 'string') session.user.role = token.role
      return session
    },
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
