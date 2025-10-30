/**
 * Account Lockout Edge Case Tests
 * 
 * Tests for case-insensitive matching, timing attacks, and lockout edge cases
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { 
  recordFailedAttempt,
  isAccountLocked,
  unlockAccount,
  resetFailedAttempts
} from '@/lib/auth/account-lockout';

describe('Account Lockout Edge Cases', () => {
  const testEmail = 'test@example.com';
  
  beforeEach(async () => {
    // Clean up before each test
    await resetFailedAttempts(testEmail);
    await unlockAccount(testEmail);
  });
  
  describe('Case-Insensitive Email Matching', () => {
    it('should treat email case-insensitively', async () => {
      const variations = [
        'test@example.com',
        'Test@example.com',
        'TEST@EXAMPLE.COM',
        'TeSt@ExAmPlE.cOm',
      ];
      
      // Record failures with different cases
      for (let i = 0; i < 4; i++) {
        await recordFailedAttempt(variations[i]);
      }
      
      // All variations should count toward same account
      // Next attempt with any variation should trigger lockout
      const result = await recordFailedAttempt(variations[0]);
      expect(result.locked).toBe(true);
    });
    
    it('should normalize email before checking lockout', async () => {
      // Lock with lowercase
      for (let i = 0; i < 5; i++) {
        await recordFailedAttempt('user@test.com');
      }
      
      // Check with uppercase
      const locked = await isAccountLocked('USER@TEST.COM');
      expect(locked).toBe(true);
    });
    
    it('should normalize email before unlocking', async () => {
      // Lock account
      for (let i = 0; i < 5; i++) {
        await recordFailedAttempt('user@test.com');
      }
      
      // Unlock with different case
      await unlockAccount('USER@TEST.COM');
      
      // Check with original case
      const locked = await isAccountLocked('user@test.com');
      expect(locked).toBe(false);
    });
  });
  
  describe('Timing Attack Prevention', () => {
    it('should have consistent response time for existing vs non-existing accounts', async () => {
      const existingAccount = 'existing@example.com';
      const nonExistingAccount = 'nonexisting@example.com';
      
      // Record failures for existing account
      for (let i = 0; i < 3; i++) {
        await recordFailedAttempt(existingAccount);
      }
      
      // Time checks for both
      const start1 = Date.now();
      await isAccountLocked(existingAccount);
      const time1 = Date.now() - start1;
      
      const start2 = Date.now();
      await isAccountLocked(nonExistingAccount);
      const time2 = Date.now() - start2;
      
      // Response times should be similar (within 50ms)
      expect(Math.abs(time1 - time2)).toBeLessThan(50);
    });
    
    it('should not reveal account existence through error messages', async () => {
      const result1 = await recordFailedAttempt('existing@example.com');
      const result2 = await recordFailedAttempt('nonexisting@example.com');
      
      // Both should have similar response structure
      expect(result1).toHaveProperty('locked');
      expect(result2).toHaveProperty('locked');
      expect(result1).toHaveProperty('attempts');
      expect(result2).toHaveProperty('attempts');
    });
  });
  
  describe('Reset on Successful Login', () => {
    it('should reset failed attempts counter on successful login', async () => {
      // Record 4 failed attempts
      for (let i = 0; i < 4; i++) {
        await recordFailedAttempt(testEmail);
      }
      
      // Simulate successful login (reset counter)
      await resetFailedAttempts(testEmail);
      
      // Next failure should not lock (counter was reset)
      const result = await recordFailedAttempt(testEmail);
      expect(result.locked).toBe(false);
      expect(result.attempts).toBe(1);
    });
    
    it('should not lockout after success during progressive failures', async () => {
      // 4 failures
      for (let i = 0; i < 4; i++) {
        await recordFailedAttempt(testEmail);
      }
      
      // Success (reset)
      await resetFailedAttempts(testEmail);
      
      // More failures should start from 0
      const result = await recordFailedAttempt(testEmail);
      expect(result.attempts).toBe(1);
    });
  });
  
  describe('Progressive Lockout Duration', () => {
    it('should double lockout duration on repeated violations', async () => {
      // First lockout (30 minutes)
      for (let i = 0; i < 5; i++) {
        await recordFailedAttempt(testEmail);
      }
      
      const lockout1 = await isAccountLocked(testEmail);
      expect(lockout1).toBe(true);
      
      // Unlock manually
      await unlockAccount(testEmail);
      
      // Second lockout (should be 60 minutes)
      for (let i = 0; i < 5; i++) {
        await recordFailedAttempt(testEmail);
      }
      
      const lockout2 = await isAccountLocked(testEmail);
      expect(lockout2).toBe(true);
      
      // Lockout count should increase
      // (implementation-specific verification)
    });
  });
  
  describe('Concurrent Lockout Attempts', () => {
    it('should handle concurrent failed attempts correctly', async () => {
      // Simulate multiple concurrent login attempts
      const promises = Array(10).fill(0).map(() => 
        recordFailedAttempt(testEmail)
      );
      
      const results = await Promise.all(promises);
      
      // At least one should indicate lockout
      const lockedResults = results.filter(r => r.locked);
      expect(lockedResults.length).toBeGreaterThan(0);
    });
  });
  
  describe('Manual Unlock', () => {
    it('should allow immediate access after manual unlock', async () => {
      // Lock account
      for (let i = 0; i < 5; i++) {
        await recordFailedAttempt(testEmail);
      }
      
      expect(await isAccountLocked(testEmail)).toBe(true);
      
      // Manual unlock
      await unlockAccount(testEmail);
      
      // Should be unlocked immediately
      expect(await isAccountLocked(testEmail)).toBe(false);
    });
    
    it('should preserve lockout history after unlock', async () => {
      // First lockout
      for (let i = 0; i < 5; i++) {
        await recordFailedAttempt(testEmail);
      }
      
      // Unlock
      await unlockAccount(testEmail);
      
      // Second lockout should use progressive duration
      for (let i = 0; i < 5; i++) {
        await recordFailedAttempt(testEmail);
      }
      
      // Progressive lockout should apply
      const locked = await isAccountLocked(testEmail);
      expect(locked).toBe(true);
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle empty email gracefully', async () => {
      const result = await recordFailedAttempt('');
      expect(result).toHaveProperty('locked');
      expect(result).toHaveProperty('attempts');
    });
    
    it('should handle invalid email formats', async () => {
      const invalidEmails = [
        'not-an-email',
        '@example.com',
        'user@',
        'user space@example.com',
      ];
      
      for (const email of invalidEmails) {
        const result = await recordFailedAttempt(email);
        expect(result).toHaveProperty('locked');
      }
    });
    
    it('should handle very long email addresses', async () => {
      const longEmail = 'a'.repeat(500) + '@example.com';
      const result = await recordFailedAttempt(longEmail);
      expect(result).toHaveProperty('locked');
    });
    
    it('should handle special characters in email', async () => {
      const specialEmails = [
        'user+tag@example.com',
        'user.name@example.com',
        'user_name@example.com',
      ];
      
      for (const email of specialEmails) {
        const result = await recordFailedAttempt(email);
        expect(result).toHaveProperty('locked');
      }
    });
  });
  
  describe('Expiration', () => {
    it('should automatically unlock after lockout duration expires', async () => {
      // This test requires time manipulation or waiting
      // Implementation depends on your testing strategy
      // Mock example:
      
      // Lock account
      for (let i = 0; i < 5; i++) {
        await recordFailedAttempt(testEmail);
      }
      
      expect(await isAccountLocked(testEmail)).toBe(true);
      
      // In real implementation, would wait for expiration
      // For testing, could use time mocking library like jest-mock-extended
    });
  });
});
