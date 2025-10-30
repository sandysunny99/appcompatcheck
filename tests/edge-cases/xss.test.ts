/**
 * XSS Edge Case Tests - Cross-Site Scripting Attack Vectors
 */

import { describe, it, expect } from '@jest/globals';
import { sanitizeHTML, preventXSS } from '@/lib/security/input-validation';

describe('XSS Edge Cases', () => {
  const xssPayloads = [
    // Basic scripts
    "<script>alert('XSS')</script>",
    "<img src=x onerror=alert('XSS')>",
    "<svg onload=alert('XSS')>",
    "<iframe src='javascript:alert(1)'>",
    
    // Event handlers
    "<body onload=alert('XSS')>",
    "<div onmouseover=alert('XSS')>",
    "<input onfocus=alert('XSS') autofocus>",
    
    // JavaScript URLs
    "javascript:alert('XSS')",
    "JaVaScRiPt:alert('XSS')",
    "j&#97;vascript:alert('XSS')",
    
    // Data URLs
    "data:text/html,<script>alert('XSS')</script>",
    "data:text/html;base64,PHNjcmlwdD5hbGVydCgnWFNTJyk8L3NjcmlwdD4=",
    
    // Unicode and encoding
    "&lt;script&gt;alert('XSS')&lt;/script&gt;",
    "%3Cscript%3Ealert('XSS')%3C/script%3E",
    "\\x3cscript\\x3ealert('XSS')\\x3c/script\\x3e",
    
    // Template injection
    "${alert('XSS')}",
    "{{alert('XSS')}}",
    "<%=alert('XSS')%>",
    
    // Style-based XSS
    "<style>@import 'javascript:alert(1)';</style>",
    "<div style='background:url(javascript:alert(1))'>",
    
    // Mutation XSS
    "<noscript><p title='</noscript><img src=x onerror=alert(1)>'>",
  ];
  
  describe('Basic XSS Prevention', () => {
    it.each(xssPayloads)('should sanitize XSS payload: %s', (payload) => {
      const sanitized = sanitizeHTML(payload);
      
      expect(sanitized).not.toMatch(/<script/i);
      expect(sanitized).not.toMatch(/javascript:/i);
      expect(sanitized).not.toMatch(/on\w+=/i);
    });
  });
  
  describe('Event Handler XSS', () => {
    it('should remove all event handlers', () => {
      const handlers = [
        '<div onclick="alert(1)">',
        '<img onload="alert(1)">',
        '<body onpageshow="alert(1)">',
      ];
      
      handlers.forEach(html => {
        const sanitized = sanitizeHTML(html);
        expect(sanitized).not.toMatch(/on\w+=/i);
      });
    });
  });
  
  describe('Encoded XSS', () => {
    it('should handle HTML entity encoding', () => {
      const encoded = "&lt;script&gt;alert('XSS')&lt;/script&gt;";
      const sanitized = sanitizeHTML(encoded);
      expect(sanitized).not.toContain('<script');
    });
    
    it('should handle URL encoding', () => {
      const encoded = "%3Cscript%3Ealert('XSS')%3C/script%3E";
      const decoded = decodeURIComponent(encoded);
      const sanitized = sanitizeHTML(decoded);
      expect(sanitized).not.toMatch(/<script/i);
    });
  });
  
  describe('Template Injection', () => {
    it('should sanitize template expressions', () => {
      const templates = [
        "${alert('XSS')}",
        "{{alert('XSS')}}",
        "{%alert('XSS')%}",
      ];
      
      templates.forEach(template => {
        const sanitized = preventXSS(template);
        expect(sanitized).not.toContain('alert');
      });
    });
  });
});
