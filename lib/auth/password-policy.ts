/**
 * Password Policy Implementation
 * 
 * Enforces strong password requirements based on OWASP guidelines
 * to protect against weak passwords and common password attacks.
 */

import { passwordPolicy } from './config';

/**
 * Password validation result
 */
export interface PasswordValidationResult {
  /**
   * Whether the password meets all requirements
   */
  valid: boolean;
  
  /**
   * Validation errors (if any)
   */
  errors: string[];
  
  /**
   * Password strength score (0-4)
   * 0 = Very Weak, 1 = Weak, 2 = Fair, 3 = Strong, 4 = Very Strong
   */
  strength: number;
  
  /**
   * Feedback for improving the password
   */
  suggestions: string[];
}

/**
 * Common weak passwords to reject
 */
const COMMON_PASSWORDS = new Set([
  'password', 'password123', '12345678', 'qwerty', 'abc123', 'monkey',
  'letmein', 'trustno1', 'dragon', 'baseball', 'iloveyou', 'master',
  'sunshine', 'ashley', 'bailey', 'shadow', 'superman', 'qazwsx',
  '123456789', '1234567890', 'password1', 'admin', 'welcome', 'login',
  'passw0rd', 'password!', 'p@ssword', 'p@ssw0rd', '123qwe', 'qwe123',
]);

/**
 * Common password patterns to detect
 */
const COMMON_PATTERNS = [
  /^(.)\1+$/, // All same character (e.g., aaaaaaaa)
  /^(01|12|23|34|45|56|67|78|89|90)+$/, // Sequential numbers
  /^(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)+$/i, // Sequential letters
  /^(qwerty|asdfgh|zxcvbn)+$/i, // Keyboard patterns
];

/**
 * Validate password against policy requirements
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  const suggestions: string[] = [];
  
  // Check minimum length
  if (password.length < passwordPolicy.minLength) {
    errors.push(`Password must be at least ${passwordPolicy.minLength} characters long`);
    suggestions.push(`Add ${passwordPolicy.minLength - password.length} more characters`);
  }
  
  // Check maximum length (prevent bcrypt DoS)
  if (password.length > passwordPolicy.maxLength) {
    errors.push(`Password must not exceed ${passwordPolicy.maxLength} characters`);
  }
  
  // Check for uppercase letters
  if (passwordPolicy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
    suggestions.push('Add at least one uppercase letter (A-Z)');
  }
  
  // Check for lowercase letters
  if (passwordPolicy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
    suggestions.push('Add at least one lowercase letter (a-z)');
  }
  
  // Check for numbers
  if (passwordPolicy.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
    suggestions.push('Add at least one number (0-9)');
  }
  
  // Check for special characters
  if (passwordPolicy.requireSpecialChars) {
    const specialCharsRegex = new RegExp(`[${passwordPolicy.specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`);
    if (!specialCharsRegex.test(password)) {
      errors.push('Password must contain at least one special character');
      suggestions.push(`Add at least one special character (${passwordPolicy.specialChars})`);
    }
  }
  
  // Check for common passwords
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    errors.push('This password is too common. Please choose a more unique password');
    suggestions.push('Use a unique combination of words or phrases');
  }
  
  // Check for common patterns
  for (const pattern of COMMON_PATTERNS) {
    if (pattern.test(password.toLowerCase())) {
      errors.push('Password contains a common pattern');
      suggestions.push('Avoid sequential or repetitive characters');
      break;
    }
  }
  
  // Calculate password strength
  const strength = calculatePasswordStrength(password);
  
  // Add strength-based suggestions
  if (strength < 3) {
    suggestions.push('Consider using a longer password with mixed character types');
  }
  if (strength < 2) {
    suggestions.push('Consider using a passphrase (e.g., "CorrectHorseBatteryStaple!")');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    strength,
    suggestions,
  };
}

/**
 * Calculate password strength score (0-4)
 * 
 * Based on entropy and character diversity
 */
export function calculatePasswordStrength(password: string): number {
  let score = 0;
  
  // Length scoring
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  
  // Character diversity
  let diversity = 0;
  if (/[a-z]/.test(password)) diversity++;
  if (/[A-Z]/.test(password)) diversity++;
  if (/\d/.test(password)) diversity++;
  if (/[^a-zA-Z0-9]/.test(password)) diversity++;
  
  if (diversity >= 3) score++;
  if (diversity >= 4) score++;
  
  // Penalize for common patterns
  for (const pattern of COMMON_PATTERNS) {
    if (pattern.test(password.toLowerCase())) {
      score = Math.max(0, score - 2);
      break;
    }
  }
  
  // Penalize for common passwords
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    score = 0;
  }
  
  // Ensure score is between 0 and 4
  return Math.min(4, Math.max(0, score));
}

/**
 * Get password strength label
 */
export function getPasswordStrengthLabel(strength: number): string {
  const labels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
  return labels[Math.max(0, Math.min(4, strength))];
}

/**
 * Get password strength color for UI
 */
export function getPasswordStrengthColor(strength: number): string {
  const colors = ['red', 'orange', 'yellow', 'lightgreen', 'green'];
  return colors[Math.max(0, Math.min(4, strength))];
}

/**
 * Check if password matches common personal information
 * 
 * @param password - Password to check
 * @param userInfo - User information (email, name, etc.)
 */
export function containsPersonalInfo(
  password: string,
  userInfo: { email?: string; firstName?: string; lastName?: string; username?: string }
): boolean {
  const lowerPassword = password.toLowerCase();
  
  // Check email
  if (userInfo.email) {
    const emailParts = userInfo.email.toLowerCase().split('@')[0].split(/[._-]/);
    for (const part of emailParts) {
      if (part.length >= 3 && lowerPassword.includes(part)) {
        return true;
      }
    }
  }
  
  // Check names
  const names = [
    userInfo.firstName?.toLowerCase(),
    userInfo.lastName?.toLowerCase(),
    userInfo.username?.toLowerCase(),
  ].filter(Boolean) as string[];
  
  for (const name of names) {
    if (name.length >= 3 && lowerPassword.includes(name)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Generate a strong password suggestion
 */
export function generateStrongPassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = passwordPolicy.specialChars;
  
  const allChars = uppercase + lowercase + numbers + special;
  
  let password = '';
  
  // Ensure at least one character from each required category
  if (passwordPolicy.requireUppercase) {
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
  }
  if (passwordPolicy.requireLowercase) {
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
  }
  if (passwordPolicy.requireNumbers) {
    password += numbers[Math.floor(Math.random() * numbers.length)];
  }
  if (passwordPolicy.requireSpecialChars) {
    password += special[Math.floor(Math.random() * special.length)];
  }
  
  // Fill the rest with random characters
  while (password.length < length) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Check if password has been compromised in data breaches
 * 
 * Uses Have I Been Pwned API (k-anonymity model)
 * 
 * @param password - Password to check
 * @returns Promise<boolean> - True if password has been compromised
 */
export async function isPasswordCompromised(password: string): Promise<boolean> {
  try {
    // Hash the password with SHA-1
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    
    // Use k-anonymity: only send first 5 characters
    const prefix = hashHex.substring(0, 5);
    const suffix = hashHex.substring(5);
    
    // Query HIBP API
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: {
        'User-Agent': 'AppCompatCheck-Password-Checker',
      },
    });
    
    if (!response.ok) {
      // If API fails, don't block the user
      console.warn('Failed to check password against breach database');
      return false;
    }
    
    const text = await response.text();
    const hashes = text.split('\n');
    
    // Check if our password hash suffix is in the results
    for (const line of hashes) {
      const [hashSuffix] = line.split(':');
      if (hashSuffix === suffix) {
        return true; // Password has been compromised
      }
    }
    
    return false; // Password not found in breach database
  } catch (error) {
    console.error('Error checking password against breach database:', error);
    // Fail open: don't block the user if the check fails
    return false;
  }
}

/**
 * Validate password with all checks including breach check
 */
export async function validatePasswordWithBreachCheck(
  password: string,
  userInfo?: { email?: string; firstName?: string; lastName?: string; username?: string }
): Promise<PasswordValidationResult> {
  // Basic validation
  const result = validatePassword(password);
  
  // Check personal information
  if (userInfo && containsPersonalInfo(password, userInfo)) {
    result.valid = false;
    result.errors.push('Password should not contain your personal information');
    result.suggestions.push('Avoid using your name, email, or username in your password');
  }
  
  // Check if password has been compromised (async)
  try {
    const compromised = await isPasswordCompromised(password);
    if (compromised) {
      result.valid = false;
      result.errors.push('This password has been found in data breaches and is not secure');
      result.suggestions.push('Choose a completely different password that has not been compromised');
      result.strength = 0; // Override strength to very weak
    }
  } catch (error) {
    // Don't fail validation if breach check fails
    console.warn('Could not verify password against breach database:', error);
  }
  
  return result;
}

/**
 * Export password policy for reference
 */
export { passwordPolicy };
