import validator from 'validator';
import { z } from 'zod';

// HTML sanitization and XSS prevention
export class InputSanitizer {
  
  // Sanitize HTML content by removing dangerous tags and attributes
  static sanitizeHtml(input: string): string {
    if (!input) return '';
    
    // Remove script tags and their content
    let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Remove dangerous event handlers
    sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^>]*/gi, '');
    
    // Remove javascript: and data: protocols
    sanitized = sanitized.replace(/javascript:/gi, '');
    sanitized = sanitized.replace(/data:/gi, '');
    
    // Remove dangerous tags
    const dangerousTags = ['script', 'object', 'embed', 'link', 'style', 'iframe', 'frame', 'frameset'];
    dangerousTags.forEach(tag => {
      const regex = new RegExp(`<\\/?${tag}\\b[^>]*>`, 'gi');
      sanitized = sanitized.replace(regex, '');
    });
    
    return sanitized.trim();
  }

  // Sanitize text input by removing/escaping special characters
  static sanitizeText(input: string, options: {
    allowHtml?: boolean;
    maxLength?: number;
    stripWhitespace?: boolean;
  } = {}): string {
    if (!input) return '';
    
    let sanitized = input;
    
    // Strip whitespace if requested
    if (options.stripWhitespace) {
      sanitized = sanitized.trim();
    }
    
    // Truncate if max length specified
    if (options.maxLength && sanitized.length > options.maxLength) {
      sanitized = sanitized.substring(0, options.maxLength);
    }
    
    // HTML encode if HTML not allowed
    if (!options.allowHtml) {
      sanitized = sanitized
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    } else {
      sanitized = this.sanitizeHtml(sanitized);
    }
    
    return sanitized;
  }

  // Sanitize SQL inputs (for additional protection beyond parameterized queries)
  static sanitizeSql(input: string): string {
    if (!input) return '';
    
    // Remove SQL injection patterns
    const sqlPatterns = [
      /(\s*(union|select|insert|update|delete|drop|create|alter|exec|execute)\s+)/gi,
      /(\s*(or|and)\s+[\w\s]*\s*=\s*[\w\s]*)/gi,
      /(--|\/\*|\*\/|;)/g,
      /(\s*1\s*=\s*1\s*)/gi,
      /(\s*1\s*=\s*0\s*)/gi,
    ];
    
    let sanitized = input;
    sqlPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });
    
    return sanitized.trim();
  }

  // Sanitize file names
  static sanitizeFileName(filename: string): string {
    if (!filename) return '';
    
    // Remove path traversal attempts
    let sanitized = filename.replace(/\.\./g, '');
    
    // Remove or replace dangerous characters
    sanitized = sanitized.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_');
    
    // Remove leading/trailing dots and spaces
    sanitized = sanitized.replace(/^[\s.]+|[\s.]+$/g, '');
    
    // Limit length
    if (sanitized.length > 255) {
      const ext = sanitized.substring(sanitized.lastIndexOf('.'));
      const name = sanitized.substring(0, 255 - ext.length);
      sanitized = name + ext;
    }
    
    return sanitized || 'untitled';
  }

  // Sanitize JSON input
  static sanitizeJson(input: any, maxDepth: number = 10): any {
    if (maxDepth <= 0) return null;
    
    if (input === null || input === undefined) return input;
    
    if (typeof input === 'string') {
      return this.sanitizeText(input, { maxLength: 10000 });
    }
    
    if (typeof input === 'number' || typeof input === 'boolean') {
      return input;
    }
    
    if (Array.isArray(input)) {
      return input.slice(0, 1000).map(item => this.sanitizeJson(item, maxDepth - 1));
    }
    
    if (typeof input === 'object') {
      const sanitized: any = {};
      let count = 0;
      for (const [key, value] of Object.entries(input)) {
        if (count >= 100) break; // Limit number of properties
        const cleanKey = this.sanitizeText(key, { maxLength: 100 });
        sanitized[cleanKey] = this.sanitizeJson(value, maxDepth - 1);
        count++;
      }
      return sanitized;
    }
    
    return null;
  }

  // Validate and sanitize email
  static sanitizeEmail(email: string): string | null {
    if (!email) return null;
    
    const trimmed = email.trim().toLowerCase();
    
    if (!validator.isEmail(trimmed)) {
      return null;
    }
    
    // Additional checks for suspicious patterns
    if (trimmed.includes('..') || trimmed.startsWith('.') || trimmed.endsWith('.')) {
      return null;
    }
    
    return trimmed;
  }

  // Validate and sanitize URL
  static sanitizeUrl(url: string, allowedProtocols: string[] = ['http', 'https']): string | null {
    if (!url) return null;
    
    const trimmed = url.trim();
    
    if (!validator.isURL(trimmed, { protocols: allowedProtocols })) {
      return null;
    }
    
    // Check for suspicious patterns
    const suspiciousPatterns = [
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /file:/i,
    ];
    
    if (suspiciousPatterns.some(pattern => pattern.test(trimmed))) {
      return null;
    }
    
    return trimmed;
  }
}

// Zod schemas for input validation
export const ValidationSchemas = {
  // User input validation
  userInput: z.object({
    firstName: z.string().min(1).max(50).regex(/^[a-zA-Z\s-']+$/, 'Invalid characters in first name'),
    lastName: z.string().min(1).max(50).regex(/^[a-zA-Z\s-']+$/, 'Invalid characters in last name'),
    email: z.string().email().max(255).toLowerCase(),
    password: z.string().min(8).max(128).regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain uppercase, lowercase, number, and special character'
    ),
  }),

  // File upload validation
  fileUpload: z.object({
    filename: z.string().min(1).max(255).regex(/^[^<>:"/\\|?*\x00-\x1f]+$/, 'Invalid filename'),
    mimetype: z.enum(['application/json', 'text/csv', 'application/vnd.ms-excel']),
    size: z.number().min(1).max(50 * 1024 * 1024), // 50MB max
  }),

  // Scan session validation
  scanSession: z.object({
    fileName: z.string().min(1).max(255),
    dataType: z.enum(['json', 'csv']),
    description: z.string().max(1000).optional(),
  }),

  // Rule validation
  rule: z.object({
    name: z.string().min(1).max(100).regex(/^[a-zA-Z0-9\s\-_]+$/, 'Invalid rule name'),
    description: z.string().min(1).max(500),
    category: z.enum(['security_tool', 'framework', 'library', 'configuration', 'custom']),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    pattern: z.string().min(1).max(10000),
    enabled: z.boolean().default(true),
  }),

  // Search and filter validation
  searchParams: z.object({
    q: z.string().max(100).optional(),
    page: z.coerce.number().min(1).max(1000).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    sort: z.enum(['asc', 'desc']).default('desc'),
    category: z.string().max(50).optional(),
    status: z.string().max(20).optional(),
  }),

  // Organization validation
  organization: z.object({
    name: z.string().min(1).max(100).regex(/^[a-zA-Z0-9\s\-_&.]+$/, 'Invalid organization name'),
    description: z.string().max(500).optional(),
    domain: z.string().max(100).regex(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Invalid domain').optional(),
  }),

  // Report generation validation
  reportOptions: z.object({
    format: z.enum(['pdf', 'excel', 'csv']),
    includeSummary: z.boolean().default(true),
    includeDetails: z.boolean().default(true),
    includeRecommendations: z.boolean().default(false),
    includeCharts: z.boolean().default(false),
    filterBy: z.object({
      severity: z.array(z.enum(['low', 'medium', 'high', 'critical'])).optional(),
      status: z.array(z.enum(['pass', 'fail', 'warning', 'info'])).optional(),
      category: z.array(z.string()).optional(),
    }).optional(),
  }),
};

// Comprehensive input validator
export class InputValidator {
  
  // Validate using Zod schema with custom error handling
  static validate<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } {
    try {
      const result = schema.parse(data);
      return { success: true, data: result };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
        return { success: false, errors };
      }
      return { success: false, errors: ['Validation failed'] };
    }
  }

  // Sanitize and validate user input
  static sanitizeAndValidate<T>(
    schema: z.ZodSchema<T>, 
    data: unknown,
    sanitizeOptions: {
      sanitizeStrings?: boolean;
      maxStringLength?: number;
      allowHtml?: boolean;
    } = {}
  ): { success: true; data: T } | { success: false; errors: string[] } {
    
    const options = {
      sanitizeStrings: true,
      maxStringLength: 1000,
      allowHtml: false,
      ...sanitizeOptions,
    };

    // Pre-sanitize the data if it's an object
    let sanitizedData = data;
    if (typeof data === 'object' && data !== null && options.sanitizeStrings) {
      sanitizedData = this.deepSanitize(data, options);
    }

    return this.validate(schema, sanitizedData);
  }

  // Deep sanitize object properties
  private static deepSanitize(obj: any, options: any): any {
    if (obj === null || obj === undefined) return obj;
    
    if (typeof obj === 'string') {
      return InputSanitizer.sanitizeText(obj, {
        allowHtml: options.allowHtml,
        maxLength: options.maxStringLength,
        stripWhitespace: true,
      });
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.deepSanitize(item, options));
    }
    
    if (typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const cleanKey = InputSanitizer.sanitizeText(key, { maxLength: 100 });
        sanitized[cleanKey] = this.deepSanitize(value, options);
      }
      return sanitized;
    }
    
    return obj;
  }

  // Check for common attack patterns
  static containsSuspiciousPatterns(input: string): boolean {
    const patterns = [
      // XSS patterns
      /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      
      // SQL injection patterns
      /(\s*(union|select|insert|update|delete|drop|create|alter|exec)\s+)/gi,
      /(\s*(or|and)\s+[\w\s]*\s*=\s*[\w\s]*)/gi,
      /(--|\/\*|\*\/)/g,
      
      // Path traversal
      /\.\./g,
      /[\/\\]etc[\/\\]/gi,
      /[\/\\]proc[\/\\]/gi,
      
      // Command injection
      /[;&|`$()]/g,
      /\b(eval|exec|system|shell_exec|passthru)\s*\(/gi,
    ];
    
    return patterns.some(pattern => pattern.test(input));
  }

  // Rate limiting validation for API endpoints
  static validateApiAccess(request: Request, userId?: number): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    // Check content type
    const contentType = request.headers.get('content-type');
    if (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH') {
      if (!contentType || !contentType.includes('application/json')) {
        errors.push('Invalid content type. Expected application/json.');
      }
    }
    
    // Check user agent
    const userAgent = request.headers.get('user-agent');
    if (!userAgent || userAgent.length < 10) {
      errors.push('Invalid or missing user agent.');
    }
    
    // Check for suspicious headers
    const suspiciousHeaders = ['x-forwarded-host', 'x-cluster-client-ip'];
    suspiciousHeaders.forEach(header => {
      if (request.headers.get(header)) {
        errors.push(`Suspicious header detected: ${header}`);
      }
    });
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Middleware to sanitize request body
export function sanitizeMiddleware(options: {
  allowHtml?: boolean;
  maxStringLength?: number;
} = {}) {
  return (req: any, res: any, next: any) => {
    if (req.body && typeof req.body === 'object') {
      req.body = InputSanitizer.sanitizeJson(req.body);
    }
    next();
  };
}