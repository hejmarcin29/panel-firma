import { NextResponse } from 'next/server'
import { createR2Client, getR2Bucket } from '@/lib/r2'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSession } from '@/lib/auth-session'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  try {
    // Require auth (to chronić prywatne pliki w dev). Można poluzować jeśli potrzeba publicznego podglądu.
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(req.url)
    const key = url.searchParams.get('key')
    if (!key) return NextResponse.json({ error: 'Brak parametru key' }, { status: 400 })

    const r2 = createR2Client()
    const bucket = getR2Bucket()
  const obj = await r2.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
  const body = (obj as any).Body as ReadableStream<Uint8Array>
    const headers = new Headers()
    headers.set('Content-Type', obj.ContentType || 'application/octet-stream')
    if (obj.ContentLength !== undefined) headers.set('Content-Length', String(obj.ContentLength))
    headers.set('Cache-Control', 'private, max-age=60')
    return new Response(body, { headers, status: 200 })
  } catch (err) {
    console.error('[GET /api/pliki/r2/proxy] Error', err)
    return NextResponse.json({ error: 'Błąd pobierania' }, { status: 500 })
  }
}
