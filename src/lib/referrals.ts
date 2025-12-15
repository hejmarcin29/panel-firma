import { customAlphabet } from 'nanoid';
import { randomUUID } from 'crypto';

const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const generateCode = customAlphabet(alphabet, 8);

export function generateReferralCode(): string {
    return generateCode();
}

export function generateReferralToken(): string {
    return randomUUID();
}
