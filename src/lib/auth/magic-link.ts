import { createHmac, timingSafeEqual } from 'crypto';

const SECRET = process.env.MAGIC_LINK_SECRET || process.env.DATABASE_URL || 'default-insecure-secret-do-not-use-prod';
const TTL_DAYS = 90;

export function generateMagicLinkToken(orderId: string): string {
    const expiresAt = Date.now() + (TTL_DAYS * 24 * 60 * 60 * 1000);
    const payload = JSON.stringify({ oid: orderId, exp: expiresAt });
    const encodedPayload = Buffer.from(payload).toString('base64url');
    
    const signature = createHmac('sha256', SECRET)
        .update(encodedPayload)
        .digest('base64url');
        
    return `${encodedPayload}.${signature}`;
}

export function verifyMagicLinkToken(token: string): string | null {
    try {
        const [encodedPayload, signature] = token.split('.');
        if (!encodedPayload || !signature) return null;

        const expectedSignature = createHmac('sha256', SECRET)
            .update(encodedPayload)
            .digest('base64url');

        const signatureBuffer = Buffer.from(signature);
        const expectedBuffer = Buffer.from(expectedSignature);

        if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
            return null;
        }

        const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf-8'));
        
        if (Date.now() > payload.exp) {
            return null;
        }

        return payload.oid;
    } catch {
        return null;
    }
}
