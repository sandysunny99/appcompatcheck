import { randomBytes } from 'crypto';

// Generate a secure random ID
export function generateId(length: number = 32): string {
  return randomBytes(length).toString('hex');
}

// Generate a URL-safe ID
export function generateUrlSafeId(length: number = 32): string {
  return randomBytes(length)
    .toString('base64url')
    .slice(0, length);
}

// Generate a numeric ID
export function generateNumericId(length: number = 10): string {
  const digits = '0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  
  return result;
}

// Generate a UUID v4-like string (not cryptographically secure UUID)
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Generate session ID
export function generateSessionId(): string {
  return generateUrlSafeId(48);
}

// Generate API key
export function generateApiKey(): string {
  const prefix = 'ak_';
  const key = generateUrlSafeId(40);
  return `${prefix}${key}`;
}

// Generate invitation token
export function generateInvitationToken(): string {
  return generateUrlSafeId(64);
}