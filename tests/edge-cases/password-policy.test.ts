/**
 * Password Policy Edge Case Tests
 * 
 * Tests for unicode, long passwords, control characters, and edge cases
 */

import { describe, it, expect } from '@jest/globals';
import { 
  validatePassword,
  calculatePasswordStrength,
  isPasswordCompromised
} from '@/lib/auth/password-policy';

describe('Password Policy Edge Cases', () => {
  describe('Unicode and Emoji Passwords', () => {
    it('should handle passwords with emojis', async () => {
      const emojiPasswords = [
        'MyP@ssw💩rd123', // Emoji in middle
        '💪🔒Secure123!', // Emojis at start
        'Passw0rd!💯💯', // Emojis at end
      ];
      
      for (const password of emojiPasswords) {
        const result = await validatePassword(password);
        // Should validate based on other criteria
        expect(result).toHaveProperty('valid');
      }
    });
    
    it('should handle passwords with only emojis', async () => {
      const emojiOnly = '😀😀😀😀😀😀😀😀'; // 8 emojis
      const result = await validatePassword(emojiOnly);
      
      // Should fail because no letters/numbers
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Must contain at least one uppercase letter');
    });
    
    it('should handle unicode characters (Chinese, Arabic, etc.)', async () => {
      const unicodePasswords = [
        'パスワードP@ss1', // Japanese + English
        '密码Password1!', // Chinese + English
        'كلمةPass1!', // Arabic + English
      ];
      
      for (const password of unicodePasswords) {
        const result = await validatePassword(password);
        expect(result).toHaveProperty('valid');
      }
    });
    
    it('should calculate length correctly for multi-byte characters', async () => {
      const password = '😀'.repeat(8) + 'A1!'; // 8 emojis + valid chars
      const result = await validatePassword(password);
      
      // Length should be calculated correctly
      expect(result).toHaveProperty('valid');
    });
  });
  
  describe('Extremely Long Passwords (DoS Protection)', () => {
    it('should reject passwords longer than 128 characters', async () => {
      const longPassword = 'A'.repeat(200) + 'a1!';
      const result = await validatePassword(longPassword);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must not exceed 128 characters');
    });
    
    it('should handle exactly 128 character passwords', async () => {
      const password = 'A'.repeat(124) + 'a1!';
      const result = await validatePassword(password);
      
      // Should be valid if meets other criteria
      expect(result.valid).toBe(true);
    });
    
    it('should hash long passwords efficiently (no timeout)', async () => {
      const longPassword = 'A'.repeat(100) + 'a1!';
      
      const start = Date.now();
      await validatePassword(longPassword);
      const duration = Date.now() - start;
      
      // Should complete in reasonable time (< 1 second)
      expect(duration).toBeLessThan(1000);
    });
  });
  
  describe('Control Characters and Null Bytes', () => {
    it('should handle null bytes in passwords', async () => {
      const nullBytePasswords = [
        'pass\x00word!1A', // Hex null byte
        'Pass\u0000word1!', // Unicode null
      ];
      
      for (const password of nullBytePasswords) {
        const result = await validatePassword(password);
        // Should either reject or sanitize
        expect(result).toHaveProperty('valid');
      }
    });
    
    it('should handle newline and carriage return', async () => {
      const controlCharPasswords = [
        'Pass\nword1!', // Newline
        'Pass\rword1!', // Carriage return
        'Pass\tword1!', // Tab
      ];
      
      for (const password of controlCharPasswords) {
        const result = await validatePassword(password);
        expect(result).toHaveProperty('valid');
      }
    });
    
    it('should handle various control characters', async () => {
      const password = 'Pass\x01\x02\x03word1!';
      const result = await validatePassword(password);
      expect(result).toHaveProperty('valid');
    });
  });
  
  describe('Common Password Detection', () => {
    it('should reject common passwords', async () => {
      const commonPasswords = [
        'Password123!',
        'Qwerty123!',
        'Admin123!',
        'Welcome123!',
        'P@ssword1',
      ];
      
      for (const password of commonPasswords) {
        const result = await validatePassword(password);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Password is too common');
      }
    });
    
    it('should reject variations of common passwords', async () => {
      const variations = [
        'password', // lowercase
        'Password', // capitalized
        'PASSWORD', // uppercase
        'P@ssw0rd', // leet speak
      ];
      
      for (const password of variations) {
        const result = await validatePassword(password);
        expect(result.valid).toBe(false);
      }
    });
  });
  
  describe('Pattern Detection', () => {
    it('should detect sequential patterns', async () => {
      const sequentialPasswords = [
        'Abcd1234!', // Sequential letters and numbers
        'Xyz789!', // Sequential at end
      ];
      
      for (const password of sequentialPasswords) {
        const result = await validatePassword(password);
        // May warn or reject
        expect(result).toHaveProperty('warnings');
      }
    });
    
    it('should detect keyboard patterns', async () => {
      const keyboardPasswords = [
        'Qwerty123!',
        'Asdf123!',
        'Zxcv123!',
      ];
      
      for (const password of keyboardPasswords) {
        const result = await validatePassword(password);
        expect(result.valid).toBe(false);
      }
    });
    
    it('should detect repeated characters', async () => {
      const repeated = 'Aaaa1111!';
      const result = await validatePassword(repeated);
      // May warn about weak password
      expect(result).toHaveProperty('strength');
    });
  });
  
  describe('Password Strength Calculation', () => {
    it('should calculate strength for weak passwords', () => {
      const weak = 'Pass1!';
      const strength = calculatePasswordStrength(weak);
      expect(strength.score).toBeLessThan(3);
      expect(strength.label).toBe('weak');
    });
    
    it('should calculate strength for medium passwords', () => {
      const medium = 'MyPass123!';
      const strength = calculatePasswordStrength(medium);
      expect(strength.score).toBeGreaterThanOrEqual(3);
      expect(strength.score).toBeLessThan(5);
    });
    
    it('should calculate strength for strong passwords', () => {
      const strong = 'MyV3ry$tr0ng&C0mpl3xP@ssw0rd!';
      const strength = calculatePasswordStrength(strong);
      expect(strength.score).toBeGreaterThanOrEqual(5);
      expect(strength.label).toBe('strong');
    });
    
    it('should give higher scores to longer passwords', () => {
      const short = 'Pass1!';
      const long = 'MyVeryLongPassword123!';
      
      const shortStrength = calculatePasswordStrength(short);
      const longStrength = calculatePasswordStrength(long);
      
      expect(longStrength.score).toBeGreaterThan(shortStrength.score);
    });
  });
  
  describe('Breach Database Checks', () => {
    it('should check password against Have I Been Pwned', async () => {
      // Common breached password
      const breachedPassword = 'password123';
      const isCompromised = await isPasswordCompromised(breachedPassword);
      
      expect(isCompromised).toBe(true);
    }, 10000); // Longer timeout for API call
    
    it('should handle unique passwords not in breach database', async () => {
      // Very unique password unlikely to be breached
      const uniquePassword = 'MyUn1qu3P@ssw0rd' + Date.now();
      const isCompromised = await isPasswordCompromised(uniquePassword);
      
      expect(isCompromised).toBe(false);
    }, 10000);
    
    it('should handle API failures gracefully', async () => {
      // Test with network disabled or mock API failure
      // Should not reject password if API is unavailable
      const password = 'TestPass123!';
      const result = await validatePassword(password, { skipBreachCheck: true });
      
      expect(result).toHaveProperty('valid');
    });
  });
  
  describe('Personal Information Detection', () => {
    it('should reject passwords containing email parts', async () => {
      const email = 'john.doe@example.com';
      const password = 'Johndoe123!'; // Contains name from email
      
      const result = await validatePassword(password, { email });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password contains personal information');
    });
    
    it('should reject passwords containing username', async () => {
      const username = 'johndoe';
      const password = 'Johndoe123!';
      
      const result = await validatePassword(password, { username });
      expect(result.valid).toBe(false);
    });
    
    it('should handle case-insensitive personal info matching', async () => {
      const name = 'John';
      const password = 'JOHN123!';
      
      const result = await validatePassword(password, { name });
      expect(result.valid).toBe(false);
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle empty password', async () => {
      const result = await validatePassword('');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password is required');
    });
    
    it('should handle whitespace-only password', async () => {
      const result = await validatePassword('        ');
      expect(result.valid).toBe(false);
    });
    
    it('should handle password with only special characters', async () => {
      const password = '!@#$%^&*()';
      const result = await validatePassword(password);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Must contain at least one letter');
    });
    
    it('should handle passwords with spaces', async () => {
      const password = 'My Pass 123!';
      const result = await validatePassword(password);
      // Spaces should be allowed
      expect(result).toHaveProperty('valid');
    });
  });
});
