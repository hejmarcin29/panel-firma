import { getSession } from "@/lib/auth-session"
import { z } from "zod"
import { createR2Client, getR2Bucket, toPublicUrl } from "@/lib/r2"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

// Next.js 15 route handler with promised params pattern not needed here

const bodySchema = z.object({
  contentType: z.string().min(1, "Wymagany typ MIME"),
  size: z.number().int().positive().max(25 * 1024 * 1024, "Maks 25 MB"),
  // optional suggested key prefix (e.g., orders/123/). We'll add a random suffix to avoid collisions.
  prefix: z.string().optional().default("uploads/"),
  filename: z.string().min(1).optional(),
})

export const runtime = "nodejs"

export async function POST(req: Request) {
  const session = await getSession()
  if (!session || !session.user?.email) {
    return Response.json({ error: "Brak autoryzacji" }, { status: 401 })
  }

  let data: z.infer<typeof bodySchema>
  try {
    const json = (await req.json()) as unknown
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return Response.json({ error: "Błędne dane", issues: parsed.error.issues }, { status: 400 })
    }
    data = parsed.data
  } catch {
    return Response.json({ error: "Niepoprawne JSON" }, { status: 400 })
  }

  const r2 = createR2Client()
  const bucket = getR2Bucket()

  // const ext = data.filename?.includes(".") ? data.filename!.split(".").pop() : undefined
  const rand = Math.random().toString(36).slice(2, 10)
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, "0")
  const dd = String(now.getDate()).padStart(2, "0")
  const datePath = `${yyyy}/${mm}/${dd}`
  const safePrefix = data.prefix!.replace(/^\/+/, "").replace(/\.+/g, ".").replace(/\\/g, "/")
  const baseName = data.filename?.replace(/[^a-zA-Z0-9._-]/g, "_") || "plik"
  const key = `${safePrefix}${datePath}/${rand}-${baseName}`

  const put = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: data.contentType,
  })

  const url = await getSignedUrl(r2, put, { expiresIn: 60 })

  return Response.json({
    ok: true,
    url,
    key,
    publicUrl: toPublicUrl(key),
  })
}
