/**
 * @file encryption.ts
 * @description Symmetric encryption utility using AES-256-GCM.
 * 
 * BUSINESS CONTEXT:
 * Loan Origination Systems store highly sensitive customer PII (Personal Identifiable Information) 
 * such as PAN card numbers, Aadhaar details, and Bank Account Numbers.
 * Under financial industry regulations, encrypting sensitive fields at rest is mandatory.
 * We use AES-256-GCM (Galois/Counter Mode) because it provides:
 * 1. Confidentiality: Strong 256-bit symmetric encryption.
 * 2. Authenticity & Integrity: GCM produces an authentication tag alongside the ciphertext. 
 *    During decryption, GCM verifies this tag to ensure the data was not modified or tampered with.
 */

import crypto from 'crypto';

const IV_LENGTH = 12; // 12 bytes is the standard for GCM

/**
 * Encrypts cleartext using AES-256-GCM.
 * 
 * @param text Cleartext string to encrypt
 * @returns Encrypted payload string in format: iv_hex:auth_tag_hex:ciphertext_hex
 * @throws Error if process.env.ENCRYPTION_KEY is invalid or missing
 */
export function encrypt(text: string): string {
  if (!text) return '';

  const encryptionKey = process.env.ENCRYPTION_KEY!; // Guaranteed to exist by fail-fast check on server boot
  const keyBuffer = Buffer.from(encryptionKey, 'hex');
  if (keyBuffer.length !== 32) {
    throw new Error('Encryption key must be exactly 32 bytes (64 hex characters).');
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts ciphertext formatted as iv_hex:auth_tag_hex:ciphertext_hex.
 * 
 * @param encryptedText Encrypted payload string
 * @returns Decrypted cleartext string
 * @throws Error if format is invalid or key mismatch/tampering detected
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return '';

  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted text format. Expected iv:authTag:ciphertext');
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const encryptionKey = process.env.ENCRYPTION_KEY!; // Guaranteed to exist by fail-fast check on server boot
  const keyBuffer = Buffer.from(encryptionKey, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');

  if (keyBuffer.length !== 32) {
    throw new Error('Encryption key must be exactly 32 bytes (64 hex characters).');
  }

  const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, undefined, 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
