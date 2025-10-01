import { createHash, randomBytes } from 'crypto';

/**
 * Hash a password using SHA-256 with a random salt
 * @param password - The plain text password
 * @returns The hashed password with salt
 */
export function hashPassword(password: string): string {
    const salt = randomBytes(16).toString('hex');
    const hash = createHash('sha256').update(password + salt).digest('hex');
    return `${salt}:${hash}`;
}

/**
 * Verify a password against a hash
 * @param password - The plain text password to verify
 * @param hashedPassword - The stored hash (format: salt:hash)
 * @returns True if password matches, false otherwise
 */
export function verifyPassword(password: string, hashedPassword: string): boolean {
    const [salt, hash] = hashedPassword.split(':');
    if (!salt || !hash) return false;

    const testHash = createHash('sha256').update(password + salt).digest('hex');
    return testHash === hash;
}
