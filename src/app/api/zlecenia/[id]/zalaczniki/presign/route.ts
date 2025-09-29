import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth-session'
import { db } from '@/db'
import { clients, orders } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { buildClientBasedKey, type R2Category } from '@/lib/r2-paths'
import { createR2Client, getR2Bucket, toPublicUrl } from '@/lib/r2'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export const runtime = 'nodejs'

const bodySchema = z.object({
  filename: z.string().min(1),
  mime: z.string().min(1),
  size: z.number().int().positive(),
  category: z.enum(['invoices','installs','contracts','protocols','other']) as z.ZodType<R2Category>,
})

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const role = session.user?.role
    if (!role || (role !== 'admin' && role !== 'manager' && role !== 'installer')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await ctx.params
    const json = await req.json().catch(() => null)
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Błąd walidacji', issues: parsed.error.issues }, { status: 400 })
    }

    // fetch order + client for key building
    const rows = await db
      .select({ orderId: orders.id, clientId: orders.clientId, clientNo: clients.clientNo, clientName: clients.name })
      .from(orders)
      .innerJoin(clients, eq(orders.clientId, clients.id))
      .where(eq(orders.id, id))
      .limit(1)

    if (rows.length === 0) return NextResponse.json({ error: 'Nie znaleziono' }, { status: 404 })
    const row = rows[0]
    const clientNo = row.clientNo ?? 0
    // clientNo could be null for legacy; fallback to 0-prefixed order seq to keep structure stable
    const built = buildClientBasedKey({
      clientNo: String(clientNo || 'X'),
      clientName: row.clientName,
      category: parsed.data.category,
      filename: parsed.data.filename,
      includeClientInFilename: true,
    })

    const r2 = createR2Client()
    const bucket = getR2Bucket()
    const put = new PutObjectCommand({
      Bucket: bucket,
      Key: built.key,
      ContentType: parsed.data.mime,
      ContentLength: parsed.data.size,
      // ACL not supported by R2; public access handled via domain binding/CORS
    })
    const url = await getSignedUrl(r2, put, { expiresIn: 60 })

    return NextResponse.json({
      url,
      key: built.key,
      publicUrl: toPublicUrl(built.key),
    })
  } catch (err) {
    console.error('[POST /api/zlecenia/:id/zalaczniki/presign] Error', err)
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 })
  }
}
