/**
 * Path Traversal Edge Case Tests
 */

import { describe, it, expect } from '@jest/globals';
import { sanitizeFilePath, preventPathTraversal } from '@/lib/security/input-validation';

describe('Path Traversal Edge Cases', () => {
  const traversalPayloads = [
    "../../../etc/passwd",
    "..\\..\\..\\windows\\system32\\drivers\\etc\\hosts",
    "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd",
    "....//....//....//etc/passwd",
    "/etc/passwd",
    "C:\\Windows\\System32\\drivers\\etc\\hosts",
    "../../../../../../etc/shadow",
    "..%2F..%2F..%2Fetc%2Fpasswd",
  ];
  
  describe('Basic Path Traversal', () => {
    it.each(traversalPayloads)('should block path traversal: %s', (payload) => {
      const sanitized = sanitizeFilePath(payload);
      
      expect(sanitized).not.toMatch(/\.\./);
      expect(sanitized).not.toMatch(/\/etc/i);
      expect(sanitized).not.toMatch(/windows/i);
    });
  });
  
  describe('Encoded Traversal', () => {
    it('should block URL-encoded path traversal', () => {
      const encoded = "%2e%2e%2f%2e%2e%2fetc%2fpasswd";
      const sanitized = preventPathTraversal(decodeURIComponent(encoded));
      expect(sanitized).not.toContain('..');
    });
  });
  
  describe('Absolute Paths', () => {
    it('should reject absolute Unix paths', () => {
      const sanitized = sanitizeFilePath('/etc/passwd');
      expect(sanitized).not.toStartWith('/');
    });
    
    it('should reject absolute Windows paths', () => {
      const sanitized = sanitizeFilePath('C:\\Windows\\System32');
      expect(sanitized).not.toMatch(/[a-z]:\\/i);
    });
  });
});
