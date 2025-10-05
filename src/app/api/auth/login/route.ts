import { NextResponse } from 'next/server'

import { signInWithCredentials } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') ?? ''
    let username: string | undefined
    let password: string | undefined

    if (contentType.includes('application/json')) {
      const { username: rawUsername, password: rawPassword } = await request.json()
      username = rawUsername
      password = rawPassword
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData()
      username = formData.get('username')?.toString()
      password = formData.get('password')?.toString()
    } else {
      return NextResponse.json({ error: 'Nieobsługiwany format danych.' }, { status: 415 })
    }

    if (!username || !password) {
      return NextResponse.json({ error: 'Podaj login i hasło.' }, { status: 400 })
    }

    const user = await signInWithCredentials({
      username,
      password,
      userAgent: request.headers.get('user-agent') ?? undefined,
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined,
    })

    return NextResponse.json({ success: true, user })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Niepoprawny login lub hasło.'
    return NextResponse.json({ error: message }, { status: 401 })
  }
}
