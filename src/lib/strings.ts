export function slugify(value: string): string {
	const normalized = value
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase();

	return normalized
		.replace(/[^a-z0-9]+/g, '_')
		.replace(/^_+|_+$/g, '')
		.replace(/_{2,}/g, '_');
}

export function sanitizeFilename(filename: string, fallback = 'zalacznik'): string {
	const trimmed = filename ? filename.trim() : '';
	const withoutPath = trimmed.replace(/\\|\//g, '');
	const lastDot = withoutPath.lastIndexOf('.');
	const base = lastDot > 0 ? withoutPath.slice(0, lastDot) : withoutPath;
	const extension = lastDot > 0 ? withoutPath.slice(lastDot + 1) : '';

	const safeBase = slugify(base) || fallback;
	return extension ? `${safeBase}.${extension.toLowerCase()}` : safeBase;
}
