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
import { 
    MONTAGE_ROOT_PREFIX, 
    ORDER_ROOT_PREFIX, 
    CLIENT_ROOT_PREFIX, 
    TASK_ROOT_PREFIX,
} from './constants';

export { 
    MONTAGE_ROOT_PREFIX, 
    ORDER_ROOT_PREFIX, 
    TASK_ROOT_PREFIX, 
    CLIENT_ROOT_PREFIX, 
} from './constants';

export async function uploadPartnerInvoice({
    partnerId,
    file,
}: {
    partnerId: string;
    file: File;
}): Promise<string> {
    const config = await getR2Config();
    const client = createR2Client(config);

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = sanitizeFilename(file.name);
    const key = `partnerzy/${partnerId}/faktury/${Date.now()}_${filename}`;

    const command = new PutObjectCommand({
        Bucket: config.bucketName,
        Key: key,
        Body: buffer,
        ContentType: file.type,
    });

    await client.send(command);

    return `${config.publicBaseUrl}/${key}`;
}

function buildMontageFolder(clientName: string): string {
	const base = slugify(clientName || 'klient');
	const safeBase = base || 'klient';
	return `${safeBase}_montaz`;
}

function buildMontagePath(customerId: string | null, montageId: string, category?: string, subCategory?: string): string {
    const root = customerId ? `${CLIENT_ROOT_PREFIX}/${customerId}` : MONTAGE_ROOT_PREFIX;
    const montageFolder = customerId ? `montaze/${montageId}` : `${montageId}`;
    
    let path = `${root}/${montageFolder}`;
    
    if (category) {
        path += `/${category}`;
        if (subCategory) {
            path += `/${subCategory}`;
        }
    }
    
    return path;
}

function buildOrderFolder(customerName: string): string {
	const base = slugify(customerName || 'klient');
	const safeBase = base || 'klient';
	return `${safeBase}/dokumenty`;
}

function buildObjectKey(root: string, folder: string, filename: string): string {
    // If root is empty (because it's included in folder for new structure), handle it
    if (!root) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const normalizedFolder = folder.replace(/^\/+|\/+$/g, '');
        return `${normalizedFolder}/${timestamp}-${filename}`;
    }

	const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
	const normalizedFolder = folder.replace(/^\/+|\/+$/g, '');
	const prefix = normalizedFolder ? `${root}/${normalizedFolder}` : root;
	return `${prefix}/${timestamp}-${filename}`;
}

function buildPublicUrl(publicBaseUrl: string, key: string): string {
	const normalizedBase = publicBaseUrl.replace(/\/?$/, '');
	const encodedKey = key
		.split('/')
		.map((segment) => encodeURIComponent(segment))
		.join('/');
	return `${normalizedBase}/${encodedKey}`;
}

export type UploadedObjectInfo = {
	key: string;
	url: string;
	bytes: number;
};

export async function uploadMontageObject(params: {
	clientName: string;
	file: File;
    montageId?: string;
    customerId?: string | null;
    category?: string;
    subCategory?: string;
}): Promise<UploadedObjectInfo> {
	const { clientName, file, montageId, customerId, category, subCategory } = params;
	const config = await getR2Config();
	const client = createR2Client(config);

	const filename = sanitizeFilename(file.name || 'zalacznik');
    
    let key: string;
    
    // New structure if montageId is provided
    if (montageId) {
        const folder = buildMontagePath(customerId || null, montageId, category, subCategory);
        key = buildObjectKey('', folder, filename);
    } else {
        // Fallback to old structure
        const folder = buildMontageFolder(clientName);
        key = buildObjectKey(MONTAGE_ROOT_PREFIX, folder, filename);
    }

	const buffer = Buffer.from(await file.arrayBuffer());

	const putParams: PutObjectCommandInput = {
		Bucket: config.bucketName,
		Key: key,
		Body: buffer,
		ContentType: file.type || 'application/octet-stream',
	};

	await client.send(new PutObjectCommand(putParams));

	const url = buildPublicUrl(config.publicBaseUrl, key);

	return {
		key,
		url,
		bytes: buffer.byteLength,
	};
}

export async function uploadOrderDocumentObject(params: {
	customerName: string;
	file: File;
}): Promise<UploadedObjectInfo> {
	const { customerName, file } = params;
	const config = await getR2Config();
	const client = createR2Client(config);

	const filename = sanitizeFilename(file.name || 'zalacznik');
	const folder = buildOrderFolder(customerName);
	const key = buildObjectKey(ORDER_ROOT_PREFIX, folder, filename);
	const buffer = Buffer.from(await file.arrayBuffer());

	const putParams: PutObjectCommandInput = {
		Bucket: config.bucketName,
		Key: key,
		Body: buffer,
		ContentType: file.type || 'application/octet-stream',
	};

	await client.send(new PutObjectCommand(putParams));

	const url = buildPublicUrl(config.publicBaseUrl, key);

	return {
		key,
		url,
		bytes: buffer.byteLength,
	};
}

export async function uploadTaskAttachmentObject(params: {
	file: File;
}): Promise<UploadedObjectInfo> {
	const { file } = params;
	const config = await getR2Config();
	const client = createR2Client(config);

	const filename = sanitizeFilename(file.name || 'zalacznik');
	const key = buildObjectKey(TASK_ROOT_PREFIX, 'attachments', filename);
	const buffer = Buffer.from(await file.arrayBuffer());

	const putParams: PutObjectCommandInput = {
		Bucket: config.bucketName,
		Key: key,
		Body: buffer,
		ContentType: file.type || 'application/octet-stream',
	};

	await client.send(new PutObjectCommand(putParams));

	const url = buildPublicUrl(config.publicBaseUrl, key);

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

export async function listObjects(prefix: string = '', delimiter: string = '/'): Promise<{ folders: string[], files: GalleryObject[] }> {
    const config = await getR2Config();
    const client = createR2Client(config);

    const folders: string[] = [];
    const files: GalleryObject[] = [];
    let continuationToken: string | undefined = undefined;

    do {
        const response = (await client.send(
            new ListObjectsV2Command({
                Bucket: config.bucketName,
                Prefix: prefix,
                Delimiter: delimiter,
                ContinuationToken: continuationToken,
            }),
        )) as ListObjectsV2CommandOutput;

        // Collect folders (CommonPrefixes)
        if (response.CommonPrefixes) {
            for (const prefixObj of response.CommonPrefixes) {
                if (prefixObj.Prefix) {
                    folders.push(prefixObj.Prefix);
                }
            }
        }

        // Collect files (Contents)
        for (const item of response.Contents ?? []) {
            const key = item.Key;
            if (!key || key.endsWith('/')) {
                continue;
            }
            // Skip if key equals prefix (it's the folder itself)
            if (key === prefix) continue;

            const pathSegments = key.split('/');
            const name = pathSegments[pathSegments.length - 1] ?? key;
            const folder = pathSegments.slice(0, -1).join('/');
            const url = buildPublicUrl(config.publicBaseUrl, key);
            // For performance, we might skip signed URL for listing many files, 
            // but for now let's keep it or make it optional. 
            // Actually, for a browser, we might want lazy loading of signed URLs.
            // Let's generate it for now.
            const previewUrl = await getSignedUrl(
                client,
                new GetObjectCommand({ Bucket: config.bucketName, Key: key }),
                { expiresIn: 60 * 60 },
            );

            files.push({
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

    return { folders, files };
}

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
			const url = buildPublicUrl(config.publicBaseUrl, key);
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

export async function uploadSignedContract({
    montageId,
    file,
}: {
    montageId: string;
    file: File;
}): Promise<string> {
    const config = await getR2Config();
    const client = createR2Client(config);

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `umowa_podpisana_${new Date().toISOString().split('T')[0]}.pdf`;
    // Store in montaze/{montageId}/umowy/
    const key = `${MONTAGE_ROOT_PREFIX}/${montageId}/umowy/${Date.now()}_${filename}`;

    const command = new PutObjectCommand({
        Bucket: config.bucketName,
        Key: key,
        Body: buffer,
        ContentType: 'application/pdf',
    });

    await client.send(command);

    return `${config.publicBaseUrl}/${key}`;
}

export async function uploadShipmentLabel({
    fileBuffer,
    fileName,
    contentType = 'application/pdf',
}: {
    fileBuffer: Buffer;
    fileName: string;
    contentType?: string;
}): Promise<string> {
    const config = await getR2Config();
    const client = createR2Client(config);

    // Save to a temporary folder
    const key = `temp-labels/${Date.now()}_${fileName}`;

    const command = new PutObjectCommand({
        Bucket: config.bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
    });

    await client.send(command);

    if (config.publicBaseUrl) {
        // Construct public URL
        const baseUrl = config.publicBaseUrl.replace(/\/$/, '');
        return `${baseUrl}/${key}`;
    }

    // Fallback if no public URL configured
    return key;
}

