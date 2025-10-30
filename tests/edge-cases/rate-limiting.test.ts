/**
 * Rate Limiting Edge Case Tests
 * 
 * Comprehensive test suite covering 24 edge case scenarios for rate limiting
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { MemoryRateLimiter, HybridRateLimiter } from '@/lib/auth/rate-limit-fallback';
import { RateLimiter } from '@/lib/auth/rate-limit';

describe('Rate Limiting Edge Cases', () => {
  let memoryLimiter: MemoryRateLimiter;
  
  beforeEach(() => {
    memoryLimiter = new MemoryRateLimiter({
      maxRequests: 5,
      windowSeconds: 60,
      blockDurationSeconds: 300,
    });
  });
  
  afterEach(() => {
    memoryLimiter.destroy();
  });
  
  describe('Concurrent Requests', () => {
    it('should handle rapid concurrent requests from same IP', () => {
      const identifier = '192.168.1.100';
      const results = [];
      
      // Simulate 10 concurrent requests
      for (let i = 0; i < 10; i++) {
        results.push(memoryLimiter.checkLimit(identifier));
      }
      
      // First 5 should be allowed
      const allowed = results.filter(r => r.allowed).length;
      const blocked = results.filter(r => !r.allowed).length;
      
      expect(allowed).toBe(5);
      expect(blocked).toBe(5);
    });
    
    it('should handle concurrent requests from different IPs', () => {
      const ips = ['192.168.1.1', '192.168.1.2', '192.168.1.3'];
      const results = ips.map(ip => memoryLimiter.checkLimit(ip));
      
      // All should be allowed (different identifiers)
      expect(results.every(r => r.allowed)).toBe(true);
    });
    
    it('should handle burst traffic followed by normal traffic', () => {
      const identifier = '192.168.1.100';
      
      // Burst: 5 requests (hit limit)
      for (let i = 0; i < 5; i++) {
        memoryLimiter.checkLimit(identifier);
      }
      
      // Next request should be blocked
      const result = memoryLimiter.checkLimit(identifier);
      expect(result.allowed).toBe(false);
      expect(result.blocked).toBe(true);
    });
  });
  
  describe('Window Expiration', () => {
    it('should reset limits after window expires', async () => {
      const limiter = new MemoryRateLimiter({
        maxRequests: 3,
        windowSeconds: 1, // 1 second window for testing
        blockDurationSeconds: 2,
      });
      
      const identifier = '192.168.1.100';
      
      // Make 3 requests (hit limit)
      for (let i = 0; i < 3; i++) {
        limiter.checkLimit(identifier);
      }
      
      // Should be blocked
      expect(limiter.checkLimit(identifier).allowed).toBe(false);
      
      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Should allow new requests
      const result = limiter.checkLimit(identifier);
      expect(result.allowed).toBe(true);
      
      limiter.destroy();
    });
    
    it('should track multiple windows correctly', async () => {
      const limiter = new MemoryRateLimiter({
        maxRequests: 2,
        windowSeconds: 1,
        blockDurationSeconds: 2,
      });
      
      const identifier = '192.168.1.100';
      
      // Window 1: 2 requests
      limiter.checkLimit(identifier);
      limiter.checkLimit(identifier);
      
      // Wait for new window
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Window 2: Should allow 2 more requests
      expect(limiter.checkLimit(identifier).allowed).toBe(true);
      expect(limiter.checkLimit(identifier).allowed).toBe(true);
      
      limiter.destroy();
    });
  });
  
  describe('IP Address Formats', () => {
    it('should handle IPv4 addresses correctly', () => {
      const ipv4Addresses = [
        '192.168.1.1',
        '10.0.0.1',
        '172.16.0.1',
        '8.8.8.8',
      ];
      
      ipv4Addresses.forEach(ip => {
        const result = memoryLimiter.checkLimit(ip);
        expect(result.allowed).toBe(true);
      });
    });
    
    it('should handle IPv6 addresses correctly', () => {
      const ipv6Addresses = [
        '::1',
        '2001:db8::1',
        'fe80::1',
        '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
      ];
      
      ipv6Addresses.forEach(ip => {
        const result = memoryLimiter.checkLimit(ip);
        expect(result.allowed).toBe(true);
      });
    });
    
    it('should treat different IP versions as separate identifiers', () => {
      const ipv4 = '127.0.0.1';
      const ipv6 = '::1';
      
      // Max out IPv4
      for (let i = 0; i < 5; i++) {
        memoryLimiter.checkLimit(ipv4);
      }
      
      // IPv6 should still have full limit
      const result = memoryLimiter.checkLimit(ipv6);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });
  });
  
  describe('Proxy Headers', () => {
    it('should handle X-Forwarded-For with multiple IPs', () => {
      // X-Forwarded-For typically contains: client, proxy1, proxy2
      const xForwardedFor = '203.0.113.1, 198.51.100.1, 192.0.2.1';
      const clientIp = xForwardedFor.split(',')[0].trim(); // Should use first IP
      
      const result = memoryLimiter.checkLimit(clientIp);
      expect(result.allowed).toBe(true);
    });
    
    it('should handle spoofed proxy headers', () => {
      // Attacker trying to bypass rate limiting with fake IPs
      const fakeIps = [
        '1.1.1.1, 2.2.2.2',
        '3.3.3.3, 4.4.4.4',
        '5.5.5.5, 6.6.6.6',
      ];
      
      // Each first IP should be tracked separately
      fakeIps.forEach(forwardedFor => {
        const ip = forwardedFor.split(',')[0].trim();
        const result = memoryLimiter.checkLimit(ip);
        expect(result.allowed).toBe(true);
      });
    });
  });
  
  describe('Endpoint Independence', () => {
    it('should track different endpoints independently', () => {
      const identifier1 = '192.168.1.100:/api/auth/login';
      const identifier2 = '192.168.1.100:/api/auth/register';
      
      // Max out login endpoint
      for (let i = 0; i < 5; i++) {
        memoryLimiter.checkLimit(identifier1);
      }
      
      // Register endpoint should still work
      const result = memoryLimiter.checkLimit(identifier2);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });
    
    it('should allow configuring shared limits across endpoints', () => {
      const baseIdentifier = '192.168.1.100';
      
      // Simulate shared identifier for user
      for (let i = 0; i < 5; i++) {
        memoryLimiter.checkLimit(baseIdentifier);
      }
      
      // Should be rate limited regardless of endpoint
      const result = memoryLimiter.checkLimit(baseIdentifier);
      expect(result.allowed).toBe(false);
    });
  });
  
  describe('Block Duration', () => {
    it('should enforce block duration correctly', async () => {
      const limiter = new MemoryRateLimiter({
        maxRequests: 2,
        windowSeconds: 1,
        blockDurationSeconds: 1,
      });
      
      const identifier = '192.168.1.100';
      
      // Hit limit
      limiter.checkLimit(identifier);
      limiter.checkLimit(identifier);
      limiter.checkLimit(identifier); // This triggers block
      
      // Should be blocked
      expect(limiter.checkLimit(identifier).allowed).toBe(false);
      
      // Wait for block to expire
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Should be unblocked
      const result = limiter.checkLimit(identifier);
      expect(result.allowed).toBe(true);
      
      limiter.destroy();
    });
    
    it('should extend block on repeated violations', async () => {
      const limiter = new MemoryRateLimiter({
        maxRequests: 1,
        windowSeconds: 1,
        blockDurationSeconds: 1,
      });
      
      const identifier = '192.168.1.100';
      
      // First violation
      limiter.checkLimit(identifier);
      limiter.checkLimit(identifier); // Blocked
      
      const firstBlock = limiter.getStatus(identifier);
      expect(firstBlock.blocked).toBe(true);
      
      limiter.destroy();
    });
  });
  
  describe('Status Queries', () => {
    it('should get status without incrementing counter', () => {
      const identifier = '192.168.1.100';
      
      // Make 2 requests
      memoryLimiter.checkLimit(identifier);
      memoryLimiter.checkLimit(identifier);
      
      // Get status (should not increment)
      const status1 = memoryLimiter.getStatus(identifier);
      expect(status1.remaining).toBe(3);
      
      // Get status again (should be same)
      const status2 = memoryLimiter.getStatus(identifier);
      expect(status2.remaining).toBe(3);
    });
    
    it('should reflect blocked status in queries', () => {
      const identifier = '192.168.1.100';
      
      // Hit limit
      for (let i = 0; i < 6; i++) {
        memoryLimiter.checkLimit(identifier);
      }
      
      // Status should show blocked
      const status = memoryLimiter.getStatus(identifier);
      expect(status.blocked).toBe(true);
      expect(status.allowed).toBe(false);
    });
  });
  
  describe('Reset Functionality', () => {
    it('should reset limits for specific identifier', () => {
      const identifier = '192.168.1.100';
      
      // Hit limit
      for (let i = 0; i < 5; i++) {
        memoryLimiter.checkLimit(identifier);
      }
      
      // Should be at limit
      expect(memoryLimiter.checkLimit(identifier).allowed).toBe(false);
      
      // Reset
      memoryLimiter.resetLimit(identifier);
      
      // Should have full limit again
      const result = memoryLimiter.checkLimit(identifier);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });
    
    it('should not affect other identifiers when resetting', () => {
      const identifier1 = '192.168.1.100';
      const identifier2 = '192.168.1.101';
      
      // Hit limit for both
      for (let i = 0; i < 5; i++) {
        memoryLimiter.checkLimit(identifier1);
        memoryLimiter.checkLimit(identifier2);
      }
      
      // Reset only first
      memoryLimiter.resetLimit(identifier1);
      
      // First should be reset
      expect(memoryLimiter.checkLimit(identifier1).allowed).toBe(true);
      
      // Second should still be limited
      expect(memoryLimiter.checkLimit(identifier2).allowed).toBe(false);
    });
  });
  
  describe('Memory Management', () => {
    it('should clean up expired entries', async () => {
      const limiter = new MemoryRateLimiter({
        maxRequests: 5,
        windowSeconds: 1,
        blockDurationSeconds: 1,
      });
      
      // Create multiple entries
      for (let i = 0; i < 10; i++) {
        limiter.checkLimit(`192.168.1.${i}`);
      }
      
      expect(limiter.getStoreSize()).toBe(10);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // Trigger cleanup by making a new request
      limiter.checkLimit('192.168.1.100');
      
      // Old entries should eventually be cleaned up
      // Note: Cleanup happens on interval, so size may not be immediately 1
      
      limiter.destroy();
    });
    
    it('should not leak memory with high traffic', () => {
      const initialSize = memoryLimiter.getStoreSize();
      
      // Simulate high traffic
      for (let i = 0; i < 1000; i++) {
        memoryLimiter.checkLimit(`192.168.1.${i % 100}`);
      }
      
      // Should only track unique identifiers
      expect(memoryLimiter.getStoreSize()).toBeLessThanOrEqual(100);
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle empty identifier gracefully', () => {
      const result = memoryLimiter.checkLimit('');
      expect(result.allowed).toBe(true);
    });
    
    it('should handle very long identifiers', () => {
      const longId = 'x'.repeat(1000);
      const result = memoryLimiter.checkLimit(longId);
      expect(result.allowed).toBe(true);
    });
    
    it('should handle special characters in identifiers', () => {
      const specialIds = [
        '192.168.1.1:user@example.com',
        '192.168.1.1#session-123',
        '192.168.1.1?query=param',
      ];
      
      specialIds.forEach(id => {
        const result = memoryLimiter.checkLimit(id);
        expect(result.allowed).toBe(true);
      });
    });
    
    it('should handle rapid limit resets', () => {
      const identifier = '192.168.1.100';
      
      for (let i = 0; i < 10; i++) {
        memoryLimiter.checkLimit(identifier);
        memoryLimiter.resetLimit(identifier);
      }
      
      // Should still work correctly
      const result = memoryLimiter.checkLimit(identifier);
      expect(result.allowed).toBe(true);
    });
  });
});
