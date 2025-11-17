import 'server-only';

import {
	GetObjectCommand,
	ListObjectsV2Command,
	PutObjectCommand,
	type PutObjectCommandInput,
	type ListObjectsV2CommandOutput,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { createR2Client } from './client';
import { getR2Config } from './config';
import { sanitizeFilename, slugify } from '@/lib/strings';

export const MONTAGE_ROOT_PREFIX = 'montaze';

function buildMontageFolder(clientName: string): string {
	const base = slugify(clientName || 'klient');
	const safeBase = base || 'klient';
	return `${safeBase}_montaz`;
}

function buildObjectKey(folder: string, filename: string): string {
	const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
	return `${MONTAGE_ROOT_PREFIX}/${folder}/${timestamp}-${filename}`;
}

function buildPublicUrl(endpoint: string, bucket: string, key: string): string {
	const normalizedEndpoint = endpoint.replace(/\/?$/, '');
	const encodedKey = key
		.split('/')
		.map((segment) => encodeURIComponent(segment))
		.join('/');
	return `${normalizedEndpoint}/${bucket}/${encodedKey}`;
}

export type UploadedObjectInfo = {
	key: string;
	url: string;
	bytes: number;
};

export async function uploadMontageObject(params: {
	clientName: string;
	file: File;
}): Promise<UploadedObjectInfo> {
	const { clientName, file } = params;
	const config = await getR2Config();
	const client = createR2Client(config);

	const filename = sanitizeFilename(file.name || 'zalacznik');
	const folder = buildMontageFolder(clientName);
	const key = buildObjectKey(folder, filename);
	const buffer = Buffer.from(await file.arrayBuffer());

	const putParams: PutObjectCommandInput = {
		Bucket: config.bucketName,
		Key: key,
		Body: buffer,
		ContentType: file.type || 'application/octet-stream',
	};

	await client.send(new PutObjectCommand(putParams));

	const url = buildPublicUrl(config.endpoint, config.bucketName, key);

	return {
		key,
		url,
		bytes: buffer.byteLength,
	};
}

export type GalleryObject = {
	key: string;
	name: string;
	folder: string;
	url: string;
	previewUrl: string;
	size: number;
	lastModified: Date | null;
};

export async function listMontageObjects(): Promise<GalleryObject[]> {
	const config = await getR2Config();
	const client = createR2Client(config);

	const results: GalleryObject[] = [];
	let continuationToken: string | undefined = undefined;

		do {
			const response = (await client.send(
			new ListObjectsV2Command({
				Bucket: config.bucketName,
				Prefix: `${MONTAGE_ROOT_PREFIX}/`,
				ContinuationToken: continuationToken,
				}),
			)) as ListObjectsV2CommandOutput;

		for (const item of response.Contents ?? []) {
			const key = item.Key;
			if (!key || key.endsWith('/')) {
				continue;
			}

			const pathSegments = key.split('/');
			const name = pathSegments[pathSegments.length - 1] ?? key;
			const folder = pathSegments.slice(0, -1).join('/');
			const url = buildPublicUrl(config.endpoint, config.bucketName, key);
			const previewUrl = await getSignedUrl(
				client,
				new GetObjectCommand({ Bucket: config.bucketName, Key: key }),
				{ expiresIn: 60 * 60 },
			);

			results.push({
				key,
				name,
				folder,
				url,
				previewUrl,
				size: Number(item.Size ?? 0),
				lastModified: item.LastModified ? new Date(item.LastModified) : null,
			});
		}

		continuationToken = response.IsTruncated ? response.NextContinuationToken ?? undefined : undefined;
	} while (continuationToken);

	results.sort((a, b) => {
		const timeA = a.lastModified ? a.lastModified.getTime() : 0;
		const timeB = b.lastModified ? b.lastModified.getTime() : 0;
		return timeB - timeA;
	});

	return results;
}
