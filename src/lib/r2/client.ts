import 'server-only';

import { S3Client } from '@aws-sdk/client-s3';

import type { R2Config } from './config';

export function createR2Client(config: R2Config): S3Client {
	return new S3Client({
		region: 'auto',
		endpoint: config.endpoint,
		forcePathStyle: true,
		credentials: {
			accessKeyId: config.accessKeyId,
			secretAccessKey: config.secretAccessKey,
		},
	});
}
