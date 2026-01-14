import 'server-only';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { createR2Client } from './client';
import { getR2Config } from './config';

/**
 * Konfiguracja jakości obrazu "Premium Flooring".
 * Balans między ostrością detali (słoje drewna) a rozmiarem pliku.
 */
const IMAGE_CONFIG = {
    maxWidth: 2560, // QHD - wystarczające dla Retina/4K jako full-width
    quality: 90,    // Wysoka jakość dla zachowania detali
    format: 'webp' as const,
};

export async function processAndUploadBuffer({
    buffer,
    folderPath,
    existingUrl
}: {
    buffer: Buffer;
    folderPath: string;
    existingUrl?: string | null;
}): Promise<string> {
    const config = await getR2Config();
    const client = createR2Client(config);

    // 2. Optymalizacja (Sharp)
    const optimizedBuffer = await sharp(buffer)
        .resize(IMAGE_CONFIG.maxWidth, IMAGE_CONFIG.maxWidth, {
            fit: 'inside',              // Skaluj tylko jeśli większe, zachowaj proporcje
            withoutEnlargement: true    // Nie powiększaj małych zdjęć (unika pixelozy)
        })
        .webp({
            quality: IMAGE_CONFIG.quality,
            smartSubsample: true,       // Ważne dla krawędzi i tekstu (chroma subsampling 4:4:4)
            effort: 6                   // Większy wysiłek kompresji (wolniej, ale lepiej)
        })
        .toBuffer();

    // 3. Generowanie unikalnej nazwy
    const uniqueId = crypto.randomUUID();
    // Używamy .webp, bo zawsze konwertujemy
    const fileName = `${uniqueId}.webp`; 
    const key = `${folderPath}/${fileName}`;

    // 4. Usuwanie starego pliku (Clean up)
    if (existingUrl) {
        await deleteImageFromR2(existingUrl);
    }

    // 5. Wysyłka do R2
    await client.send(new PutObjectCommand({
        Bucket: config.bucketName,
        Key: key,
        Body: optimizedBuffer,
        ContentType: 'image/webp',
        // Cache na stałe, bo nazwa jest unikalna (UUID)
        CacheControl: 'public, max-age=31536000, immutable' 
    }));

    // 6. Zwrot publicznego URL
    // Zakładamy, że config.publicBaseUrl nie ma końcowego slasha
    return `${config.publicBaseUrl}/${key}`;
}

/**
 * Przetwarza i wysyła obraz do Cloudflare R2.
 * 
 * @param file - Plik z formularza (File)
 * @param folderPath - Ścieżka docelowa (bez końcowego slash, np. "products/123")
 * @param existingUrl - (Opcjonalnie) URL starego zdjęcia do usunięcia
 */
export async function processAndUploadImage({
    file,
    folderPath,
    existingUrl
}: {
    file: File;
    folderPath: string;
    existingUrl?: string | null;
}): Promise<string> {
    // 1. Walidacja
    if (!file.type.startsWith('image/')) {
        throw new Error('Przesłany plik nie jest obrazem.');
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return processAndUploadBuffer({
        buffer,
        folderPath,
        existingUrl
    });
}

/**
 * Usuwa plik z R2 na podstawie pełnego URL.
 */
export async function deleteImageFromR2(fileUrl: string): Promise<void> {
    if (!fileUrl) return;

    try {
        const config = await getR2Config();
        const client = createR2Client(config);

        // Wyciągnięcie klucza (ścieżki) z URL
        // URL: https://pub-...r2.dev/products/123/abc.webp
        // Key: products/123/abc.webp
        const urlParts = fileUrl.split(config.publicBaseUrl);
        if (urlParts.length < 2) return; // Nieprawidłowy URL (np. zewnętrzny z WP)
        
        let key = urlParts[1];
        if (key.startsWith('/')) key = key.substring(1);

        await client.send(new DeleteObjectCommand({
            Bucket: config.bucketName,
            Key: key,
        }));
    } catch (error) {
        console.error('Błąd usuwania pliku z R2:', error);
        // Nie rzucamy błędu, żeby nie blokować głównej operacji
    }
}
