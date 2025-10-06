import "server-only";

import {
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { extname } from "node:path";

const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_BUCKET;
const accountId = process.env.R2_ACCOUNT_ID;

const endpoint =
  process.env.R2_ENDPOINT ??
  (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined);

if (!accessKeyId || !secretAccessKey || !bucket) {
  throw new Error(
    "Brakuje konfiguracji R2 (R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET)."
  );
}
if (!endpoint) {
  throw new Error(
    "Brakuje endpointu R2. Dodaj R2_ENDPOINT lub R2_ACCOUNT_ID do konfiguracji."
  );
}
// ✳️ sanity check: endpoint musi zawierać accountId
if (accountId && !endpoint.includes(accountId)) {
  throw new Error(
    `R2_ENDPOINT nie pasuje do R2_ACCOUNT_ID. Oczekiwano https://${accountId}.r2.cloudflarestorage.com`
  );
}

export const r2Client = new S3Client({
  region: "auto",
  endpoint,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  // ✳️ najważniejsze dla R2
  forcePathStyle: true,
});

const RAW_DEFAULT_PREFIX = process.env.R2_BASE_PREFIX ?? "attachments/";
// ✳️ zawsze z trailing slash
const DEFAULT_PREFIX = RAW_DEFAULT_PREFIX.endsWith("/")
  ? RAW_DEFAULT_PREFIX
  : `${RAW_DEFAULT_PREFIX}/`;

const NAME_SLUG_REGEX = /[^\p{L}\p{N}]+/gu;

function slugifyName(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(NAME_SLUG_REGEX, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

function sanitizeFileName(originalName: string) {
  const trimmed = originalName.trim();
  const ext = extname(trimmed).toLowerCase();
  const base = trimmed.slice(0, Math.max(0, trimmed.length - ext.length));
  const normalizedBase = slugifyName(base) || "plik";
  const safeExt = ext.replace(/[^a-z0-9.]/g, "");
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "-")
    .replace("Z", "");
  return `${timestamp}-${normalizedBase}${safeExt}`;
}

export function resolveClientFolderSegment(
  clientId: string,
  fullName?: string | null,
) {
  if (!fullName) {
    return clientId;
  }
  const slug = slugifyName(fullName);
  return slug ? `${clientId}_${slug}` : clientId;
}

export function getClientFolderPrefix(
  clientId: string,
  fullName?: string | null,
) {
  const segment = resolveClientFolderSegment(clientId, fullName);
  return `${DEFAULT_PREFIX}${segment}/`;
}

type UploadClientAttachmentInput = {
  clientId: string;
  clientFullName?: string | null;
  fileName: string;
  contentType?: string | null;
  body: Buffer | Uint8Array;
  metadata?: Record<string, string>;
};

export async function uploadClientAttachment({
  clientId,
  clientFullName,
  fileName,
  contentType,
  body,
  metadata,
}: UploadClientAttachmentInput) {
  const prefix = getClientFolderPrefix(clientId, clientFullName);
  const safeName = sanitizeFileName(fileName);
  const key = `${prefix}${safeName}`;

  await r2Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType ?? "application/octet-stream",
      Metadata: metadata,
    }),
  );

  return { key, fileName: safeName };
}

type EnsureClientFolderInput = {
  clientId: string;
  clientFullName?: string | null;
};

export async function ensureClientFolder({
  clientId,
  clientFullName,
}: EnsureClientFolderInput) {
  const prefix = getClientFolderPrefix(clientId, clientFullName);
  const key = `${prefix}.keep`;

  await r2Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: new Uint8Array(0),
      ContentType: "application/x-directory",
      Metadata: {
        "client-id": clientId,
        ...(clientFullName ? { "client-label": clientFullName } : {}),
      },
    }),
  );

  return { prefix, placeholderKey: key };
}

export type R2ObjectSummary = {
  key: string;
  fileName: string;
  size: number;
  lastModified: Date | null;
};

export type ClientFolderSummary = {
  clientId: string;
  label: string;
  prefix: string;
  objects: R2ObjectSummary[];
  totalSize: number;
  latestUploadAt: Date | null;
};

// ✳️ UNICODE: \p{L} = litery, \p{N} = cyfry
const TITLE_CASE_REGEX = /(^[\p{L}\p{N}])|([\s-][\p{L}\p{N}])/gu;

function toTitleCase(value: string) {
  return value.toLowerCase().replace(TITLE_CASE_REGEX, (m) => m.toUpperCase());
}

function parseClientSegment(segment: string) {
  const [clientId, ...nameParts] = segment.split("_");
  const rawName = nameParts.join("_");

  if (!nameParts.length) {
    return { clientId: segment, label: segment };
  }
  const preparedName = rawName.replace(/[-_]+/g, " ");
  return {
    clientId: clientId || segment,
    label: `${clientId ?? segment} — ${toTitleCase(preparedName)}`.trim(),
  };
}

export type ListClientFoldersOptions = {
  prefix?: string;
  maxObjects?: number;
};

export async function listClientFolders({
  prefix = DEFAULT_PREFIX,
  maxObjects = 2000,
}: ListClientFoldersOptions = {}): Promise<ClientFolderSummary[]> {
  const normalizedPrefix = prefix.endsWith("/") ? prefix : `${prefix}/`;

  const itemsByFolder = new Map<
    string,
    { meta: ClientFolderSummary; objects: R2ObjectSummary[] }
  >();

  let continuationToken: string | undefined;
  let fetchedObjects = 0;

  do {
    const remaining = maxObjects - fetchedObjects;
    if (remaining <= 0) break;

    const response = await r2Client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: normalizedPrefix,
        ContinuationToken: continuationToken,
        MaxKeys: Math.min(1000, remaining),
        // Delimiter: "/", // (opcjonalnie) jeśli chcesz dostać "pseudofoldery" w CommonPrefixes
      })
    );

    const contents = response.Contents ?? [];

    for (const entry of contents) {
      const key = entry.Key;
      if (!key || key.endsWith("/")) continue;
      if (!key.startsWith(normalizedPrefix)) continue;

      const relativePath = key.slice(normalizedPrefix.length);
      if (!relativePath) continue;

      const segments = relativePath.split("/");
      if (segments.length < 2) continue; // plik luzem w prefixie – pomijamy

      const [clientSegment, ...restSegments] = segments;
      const fileName = restSegments.join("/");
      if (!fileName) continue;

      const { clientId, label } = parseClientSegment(clientSegment);
      const folderKey = `${normalizedPrefix}${clientSegment}/`;

      const current = itemsByFolder.get(clientSegment);
      if (!current) {
        itemsByFolder.set(clientSegment, {
          meta: {
            clientId,
            label,
            prefix: folderKey,
            objects: [],
            totalSize: 0,
            latestUploadAt: null,
          },
          objects: [],
        });
      }

      if (fileName === ".keep") {
        continue;
      }

      const objectSummary: R2ObjectSummary = {
        key,
        fileName,
        size: entry.Size ?? 0,
        lastModified: entry.LastModified ?? null,
      };

      itemsByFolder.get(clientSegment)!.objects.push(objectSummary);
    }

    fetchedObjects += contents.length;
    continuationToken = response.NextContinuationToken ?? undefined;
  } while (continuationToken && fetchedObjects < maxObjects);

  const results: ClientFolderSummary[] = [];

  for (const { meta, objects } of itemsByFolder.values()) {
    const sortedObjects = objects.sort((a, b) => {
      const aTime = a.lastModified ? a.lastModified.getTime() : 0;
      const bTime = b.lastModified ? b.lastModified.getTime() : 0;
      return bTime - aTime;
    });

    const totalSize = sortedObjects.reduce((acc, item) => acc + item.size, 0);
    const latestUploadAt = sortedObjects[0]?.lastModified ?? null;

    results.push({
      ...meta,
      objects: sortedObjects,
      totalSize,
      latestUploadAt,
    });
  }

  return results.sort((a, b) => {
    const aTime = a.latestUploadAt ? a.latestUploadAt.getTime() : 0;
    const bTime = b.latestUploadAt ? b.latestUploadAt.getTime() : 0;
    return bTime - aTime;
  });
}

export async function getObjectDownloadUrl(
  key: string,
  expiresInSeconds = 300
) {
  // szybki HEAD pozwala ładnie zwrócić błąd gdy klucz nie istnieje
  try {
    await r2Client.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );
  } catch {
    throw new Error("Plik nie istnieje lub jest niedostępny.");
  }

  const signedUrl = await getSignedUrl(
    r2Client,
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn: expiresInSeconds }
  );
  return signedUrl;
}

// (opcjonalnie) publiczny URL, jeśli masz R2_PUBLIC_BASE (bucket/domena publiczna)
export function getPublicUrl(key: string) {
  const base = process.env.R2_PUBLIC_BASE;
  if (!base) throw new Error("R2_PUBLIC_BASE nie jest ustawione.");
  return `${base.replace(/\/+$/, "")}/${encodeURIComponent(key)}`;
}

export async function listClientAttachments(
  clientId: string,
  options: { fullName?: string | null; limit?: number } = {},
) {
  const prefix = getClientFolderPrefix(clientId, options.fullName);
  const response = await r2Client.send(
    new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      MaxKeys: options.limit ?? 1000,
    }),
  );

  const contents = response.Contents ?? [];
  const objects: R2ObjectSummary[] = contents
    .filter((item) => item.Key && !item.Key.endsWith("/"))
    .map((item) => ({
      key: item.Key!,
      fileName: item.Key!.slice(prefix.length),
      size: item.Size ?? 0,
      lastModified: item.LastModified ?? null,
    }));

  if (objects.length === 0) {
    const folders = await listClientFolders();
    const match = folders.find((folder) => folder.clientId === clientId);
    if (match) {
      return match.objects;
    }
  }

  return objects.sort((a, b) => {
    const aTime = a.lastModified ? a.lastModified.getTime() : 0;
    const bTime = b.lastModified ? b.lastModified.getTime() : 0;
    return bTime - aTime;
  });
}
