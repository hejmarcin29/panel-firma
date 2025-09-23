import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"
import { verify } from "@/lib/hash"

export const authOptions = {
  adapter: DrizzleAdapter(db),
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
    async jwt({ token, user }: any) {
      if (user) {
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }: any) {
      (session as any).user.role = token.role
      return session
    },
  },
}

const handler = NextAuth(authOptions as any)
export { handler as GET, handler as POST }
