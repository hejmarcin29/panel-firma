// Server-only R2 (S3-compatible) utilities for Cloudflare R2
// Note: Must be used in Node (route handlers / server actions)
import { S3Client } from "@aws-sdk/client-s3"

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Brak zmiennej środowiskowej: ${name}`)
  return v
}

export function getR2Endpoint() {
  // Either full https://<accountid>.r2.cloudflarestorage.com or custom domain endpoint
  return requireEnv("R2_ENDPOINT")
}

export function getR2Bucket() {
  return requireEnv("R2_BUCKET")
}

export function getR2PublicBaseUrl() {
  // Public base URL for serving files: e.g. https://cdn.example.com or https://<accountid>.r2.cloudflarestorage.com/<bucket>
  // If set to a domain without bucket segment, we'll build urls as `${base}/${key}` (assumes bucket mapped via custom domain).
  return requireEnv("R2_PUBLIC_BASE_URL")
}

export function createR2Client() {
  const endpoint = getR2Endpoint()
  const region = process.env.R2_REGION || "auto"
  const accessKeyId = requireEnv("R2_ACCESS_KEY_ID")
  const secretAccessKey = requireEnv("R2_SECRET_ACCESS_KEY")
  return new S3Client({
    region,
    endpoint,
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
  })
}

export function toPublicUrl(key: string) {
  const base = getR2PublicBaseUrl().replace(/\/$/, "")
  return `${base}/${encodeURI(key)}`
}
