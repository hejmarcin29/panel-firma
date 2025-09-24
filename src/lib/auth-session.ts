import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export type UserRole = 'admin' | 'installer' | 'architect' | 'manager'

export interface SessionLike {
  user?: {
    id?: string | null
    email?: string | null
    role?: UserRole | string | null
  } | null
}

export async function getSession(): Promise<SessionLike | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- 2025-09-24: ograniczamy do jednego miejsca różnice typów NextAuth
  return (await getServerSession(authOptions as any)) as SessionLike | null
}

export function isUserRole(v: unknown): v is UserRole {
  return v === 'admin' || v === 'installer' || v === 'architect' || v === 'manager'
}
