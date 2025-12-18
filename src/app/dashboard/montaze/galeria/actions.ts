'use server';

import { listObjects } from '@/lib/r2/storage';

export async function getR2Items(prefix: string = '') {
    return await listObjects(prefix);
}
