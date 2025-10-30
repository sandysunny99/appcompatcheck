/**
 * Input Validation and Sanitization
 * 
 * Utilities for validating and sanitizing user input to prevent
 * injection attacks, XSS, and other security vulnerabilities.
 */

/**
 * Sanitize HTML to prevent XSS attacks
 */
export function sanitizeHTML(input: string): string {
  if (!input) return '';
  
  // Remove all HTML tags and decode HTML entities
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&');
}

/**
 * Sanitize string for SQL queries (basic protection, use parameterized queries!)
 */
export function sanitizeSQL(input: string): string {
  if (!input) return '';
  
  // Remove SQL injection patterns
  return input
    .replace(/['";\\]/g, '') // Remove quotes and backslashes
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove block comment starts
    .replace(/\*\//g, '') // Remove block comment ends
    .trim();
}

/**
 * Sanitize file path to prevent directory traversal
 */
export function sanitizeFilePath(input: string): string {
  if (!input) return '';
  
  // Remove path traversal attempts
  return input
    .replace(/\.\./g, '') // Remove parent directory references
    .replace(/[\/\\]+/g, '/') // Normalize slashes
    .replace(/^\/+/, '') // Remove leading slashes
    .trim();
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(input: string): string {
  if (!input) return '';
  
  // Remove whitespace and convert to lowercase
  return input.trim().toLowerCase();
}

/**
 * Sanitize URL to prevent javascript: and data: protocols
 */
export function sanitizeURL(input: string): string {
  if (!input) return '';
  
  const trimmed = input.trim();
  
  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  for (const protocol of dangerousProtocols) {
    if (trimmed.toLowerCase().startsWith(protocol)) {
      return '';
    }
  }
  
  return trimmed;
}

/**
 * Sanitize filename to prevent security issues
 */
export function sanitizeFilename(input: string): string {
  if (!input) return '';
  
  // Remove directory separators and special characters
  return input
    .replace(/[\/\\]/g, '') // Remove slashes
    .replace(/[<>:"|?*]/g, '') // Remove Windows invalid chars
    .replace(/\.\./g, '') // Remove parent directory references
    .replace(/^\.+/, '') // Remove leading dots
    .trim()
    .substring(0, 255); // Limit length
}

/**
 * Validate and sanitize integer input
 */
export function sanitizeInteger(input: any, min?: number, max?: number): number | null {
  const num = parseInt(input, 10);
  
  if (isNaN(num)) return null;
  if (min !== undefined && num < min) return null;
  if (max !== undefined && num > max) return null;
  
  return num;
}

/**
 * Validate and sanitize float input
 */
export function sanitizeFloat(input: any, min?: number, max?: number): number | null {
  const num = parseFloat(input);
  
  if (isNaN(num)) return null;
  if (min !== undefined && num < min) return null;
  if (max !== undefined && num > max) return null;
  
  return num;
}

/**
 * Sanitize boolean input
 */
export function sanitizeBoolean(input: any): boolean {
  if (typeof input === 'boolean') return input;
  if (input === 'true' || input === '1' || input === 1) return true;
  if (input === 'false' || input === '0' || input === 0) return false;
  return false;
}

/**
 * Sanitize JSON string
 */
export function sanitizeJSON(input: string): any | null {
  if (!input) return null;
  
  try {
    return JSON.parse(input);
  } catch (error) {
    return null;
  }
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate phone number format (basic)
 */
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-()]{10,}$/;
  return phoneRegex.test(phone);
}

/**
 * Sanitize object by removing potentially dangerous properties
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  allowedKeys: string[]
): Partial<T> {
  const sanitized: Partial<T> = {};
  
  for (const key of allowedKeys) {
    if (key in obj) {
      sanitized[key as keyof T] = obj[key];
    }
  }
  
  return sanitized;
}

/**
 * Escape special characters for regex
 */
export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Truncate string to maximum length
 */
export function truncateString(input: string, maxLength: number): string {
  if (!input || input.length <= maxLength) return input;
  return input.substring(0, maxLength);
}

/**
 * Remove null bytes from string
 */
export function removeNullBytes(input: string): string {
  return input.replace(/\0/g, '');
}

/**
 * Normalize whitespace in string
 */
export function normalizeWhitespace(input: string): string {
  return input.replace(/\s+/g, ' ').trim();
}

/**
 * Check if string contains only alphanumeric characters
 */
export function isAlphanumeric(input: string): boolean {
  return /^[a-zA-Z0-9]+$/.test(input);
}

/**
 * Check if string contains only letters
 */
export function isAlpha(input: string): boolean {
  return /^[a-zA-Z]+$/.test(input);
}

/**
 * Check if string contains only numbers
 */
export function isNumeric(input: string): boolean {
  return /^[0-9]+$/.test(input);
}

/**
 * Sanitize search query to prevent injection
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query) return '';
  
  return query
    .trim()
    .replace(/[<>'"`;(){}[\]\\]/g, '') // Remove potentially dangerous characters
    .substring(0, 200); // Limit length
}

/**
 * Validate IP address format
 */
export function isValidIPAddress(ip: string): boolean {
  // IPv4
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(ip)) {
    const parts = ip.split('.');
    return parts.every(part => {
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255;
    });
  }
  
  // IPv6 (basic check)
  const ipv6Regex = /^([0-9a-f]{0,4}:){7}[0-9a-f]{0,4}$/i;
  return ipv6Regex.test(ip);
}

/**
 * Comprehensive input sanitization for common use cases
 */
export function sanitizeInput(input: any, type: 'string' | 'email' | 'url' | 'int' | 'float' | 'bool' | 'html'): any {
  switch (type) {
    case 'string':
      return typeof input === 'string' ? normalizeWhitespace(removeNullBytes(input)) : '';
    case 'email':
      return sanitizeEmail(input);
    case 'url':
      return sanitizeURL(input);
    case 'int':
      return sanitizeInteger(input);
    case 'float':
      return sanitizeFloat(input);
    case 'bool':
      return sanitizeBoolean(input);
    case 'html':
      return sanitizeHTML(input);
    default:
      return input;
  }
}

/**
 * Rate limit key sanitization
 */
export function sanitizeRateLimitKey(key: string): string {
  return key
    .replace(/[^a-zA-Z0-9:_-]/g, '_')
    .substring(0, 100);
}

/**
 * Sanitize database identifier (table/column name)
 */
export function sanitizeDatabaseIdentifier(identifier: string): string {
  // Only allow alphanumeric and underscores
  return identifier.replace(/[^a-zA-Z0-9_]/g, '').substring(0, 64);
}
