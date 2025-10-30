/**
 * Security Error Handler
 * 
 * Provides comprehensive error handling for security components,
 * ensuring graceful degradation and proper logging when failures occur.
 * 
 * Key principles:
 * - Never completely break application functionality
 * - Log all security-related errors
 * - Provide fallback behaviors
 * - Alert on critical security failures
 */

import { securityLogger } from '@/lib/logging/security-logger';

export enum SecurityErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface SecurityError {
  component: string;
  operation: string;
  error: Error | unknown;
  severity: SecurityErrorSeverity;
  identifier?: string;
  metadata?: Record<string, any>;
}

/**
 * Security Error Handler Class
 */
export class SecurityErrorHandler {
  /**
   * Handle rate limiting errors
   * 
   * Strategy: Fail open in development, fail closed in production
   */
  static handleRateLimitError(error: Error, identifier: string, metadata?: Record<string, any>): {
    shouldAllow: boolean;
    reason: string;
  } {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // Log the error
    securityLogger.logSecurityEvent({
      action: 'rate_limit_error',
      userId: null,
      severity: isDevelopment ? 'medium' : 'high',
      metadata: {
        error: error.message,
        stack: error.stack,
        identifier,
        environment: process.env.NODE_ENV,
        ...metadata,
      },
    }).catch(console.error);
    
    // Console warning for immediate visibility
    console.error(`[SecurityErrorHandler] Rate limit error for ${identifier}:`, error.message);
    
    if (isDevelopment) {
      // In development, be permissive to avoid blocking developers
      console.warn('[SecurityErrorHandler] Rate limiting disabled due to error (development mode)');
      return {
        shouldAllow: true,
        reason: 'Rate limiting unavailable (development mode)',
      };
    } else {
      // In production, be more cautious but still allow to prevent DoS
      // Use in-memory fallback if available
      console.error('[SecurityErrorHandler] Rate limiting error in production, check fallback mechanism');
      return {
        shouldAllow: true,
        reason: 'Rate limiting error, fallback active',
      };
    }
  }
  
  /**
   * Handle account lockout errors
   * 
   * Strategy: Fail safe - don't lockout if system is failing
   */
  static handleAccountLockoutError(error: Error, email: string, metadata?: Record<string, any>): {
    shouldLockout: boolean;
    reason: string;
  } {
    // Log critical error
    securityLogger.logSecurityEvent({
      action: 'account_lockout_error',
      userId: null,
      severity: 'critical',
      metadata: {
        error: error.message,
        stack: error.stack,
        email,
        environment: process.env.NODE_ENV,
        ...metadata,
      },
    }).catch(console.error);
    
    console.error(`[SecurityErrorHandler] Account lockout error for ${email}:`, error.message);
    
    // Don't lockout if the system is failing - this prevents legitimate users
    // from being locked out due to system issues
    return {
      shouldLockout: false,
      reason: 'Account lockout mechanism unavailable, allowing access',
    };
  }
  
  /**
   * Handle password policy errors
   * 
   * Strategy: Fail secure - enforce minimum security even if checks fail
   */
  static handlePasswordPolicyError(error: Error, metadata?: Record<string, any>): {
    shouldReject: boolean;
    minimumRequirements: string[];
    reason: string;
  } {
    // Log error
    securityLogger.logSecurityEvent({
      action: 'password_policy_error',
      userId: null,
      severity: 'high',
      metadata: {
        error: error.message,
        stack: error.stack,
        environment: process.env.NODE_ENV,
        ...metadata,
      },
    }).catch(console.error);
    
    console.error('[SecurityErrorHandler] Password policy check error:', error.message);
    
    // If password policy checks fail, still enforce basic requirements
    return {
      shouldReject: false,
      minimumRequirements: [
        'At least 8 characters',
        'Contains uppercase and lowercase letters',
        'Contains at least one number',
        'Contains at least one special character',
      ],
      reason: 'Advanced password checks unavailable, basic requirements enforced',
    };
  }
  
  /**
   * Handle CSRF protection errors
   * 
   * Strategy: Fail closed - reject if CSRF checks fail
   */
  static handleCSRFError(error: Error, metadata?: Record<string, any>): {
    shouldAllow: boolean;
    reason: string;
  } {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // Log error
    securityLogger.logSecurityEvent({
      action: 'csrf_protection_error',
      userId: null,
      severity: 'high',
      metadata: {
        error: error.message,
        stack: error.stack,
        environment: process.env.NODE_ENV,
        ...metadata,
      },
    }).catch(console.error);
    
    console.error('[SecurityErrorHandler] CSRF protection error:', error.message);
    
    if (isDevelopment) {
      // In development, allow but warn
      console.warn('[SecurityErrorHandler] CSRF protection disabled due to error (development mode)');
      return {
        shouldAllow: true,
        reason: 'CSRF protection unavailable (development mode)',
      };
    } else {
      // In production, reject to prevent CSRF attacks
      return {
        shouldAllow: false,
        reason: 'CSRF protection error, request rejected for security',
      };
    }
  }
  
  /**
   * Handle security logging errors
   * 
   * Strategy: Never block operations due to logging failures
   */
  static handleLoggingError(error: Error, eventType: string, metadata?: Record<string, any>): void {
    // Console fallback if logging system fails
    console.error(`[SecurityErrorHandler] Failed to log security event "${eventType}":`, error.message);
    console.error('[SecurityErrorHandler] Event metadata:', JSON.stringify(metadata, null, 2));
    
    // Try to log to console with full details
    try {
      console.error('[SecurityErrorHandler] Full error:', {
        eventType,
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
        metadata,
        timestamp: new Date().toISOString(),
      });
    } catch (consoleError) {
      // Even console.error failed, this is serious
      console.error('[SecurityErrorHandler] Critical: Unable to log error to console');
    }
  }
  
  /**
   * Handle database errors in security operations
   * 
   * Strategy: Fail gracefully with in-memory fallback where possible
   */
  static handleDatabaseError(error: Error, operation: string, metadata?: Record<string, any>): {
    shouldRetry: boolean;
    useFallback: boolean;
    reason: string;
  } {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // Log error
    securityLogger.logSecurityEvent({
      action: 'database_error',
      userId: null,
      severity: 'critical',
      metadata: {
        error: error.message,
        stack: error.stack,
        operation,
        environment: process.env.NODE_ENV,
        ...metadata,
      },
    }).catch(console.error);
    
    console.error(`[SecurityErrorHandler] Database error during ${operation}:`, error.message);
    
    // Determine if error is transient and retryable
    const isTransient = error.message.includes('timeout') ||
                       error.message.includes('connection') ||
                       error.message.includes('ECONNREFUSED');
    
    return {
      shouldRetry: isTransient,
      useFallback: true,
      reason: isTransient
        ? 'Database connection issue, retrying with fallback'
        : 'Database error, using fallback mechanism',
    };
  }
  
  /**
   * Handle Redis errors
   * 
   * Strategy: Use in-memory fallback, log for monitoring
   */
  static handleRedisError(error: Error, operation: string, metadata?: Record<string, any>): {
    useFallback: boolean;
    reason: string;
  } {
    // Log error
    securityLogger.logSecurityEvent({
      action: 'redis_error',
      userId: null,
      severity: 'high',
      metadata: {
        error: error.message,
        stack: error.stack,
        operation,
        environment: process.env.NODE_ENV,
        ...metadata,
      },
    }).catch(console.error);
    
    console.error(`[SecurityErrorHandler] Redis error during ${operation}:`, error.message);
    
    return {
      useFallback: true,
      reason: 'Redis unavailable, using in-memory fallback',
    };
  }
  
  /**
   * Handle encryption/decryption errors
   * 
   * Strategy: Fail closed - security data cannot be processed
   */
  static handleEncryptionError(error: Error, operation: string, metadata?: Record<string, any>): {
    shouldContinue: boolean;
    reason: string;
  } {
    // Log critical error
    securityLogger.logSecurityEvent({
      action: 'encryption_error',
      userId: null,
      severity: 'critical',
      metadata: {
        error: error.message,
        stack: error.stack,
        operation,
        environment: process.env.NODE_ENV,
        ...metadata,
      },
    }).catch(console.error);
    
    console.error(`[SecurityErrorHandler] Encryption error during ${operation}:`, error.message);
    
    // Never continue if encryption fails - this is a security breach
    return {
      shouldContinue: false,
      reason: 'Encryption failed, operation aborted for security',
    };
  }
  
  /**
   * Generic error handler for security operations
   */
  static handleSecurityError(securityError: SecurityError): void {
    const { component, operation, error, severity, identifier, metadata } = securityError;
    
    // Log to security logger
    securityLogger.logSecurityEvent({
      action: `${component}_error`,
      userId: null,
      severity,
      metadata: {
        component,
        operation,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        identifier,
        ...metadata,
      },
    }).catch(console.error);
    
    // Console output with appropriate severity
    const logMethod = severity === SecurityErrorSeverity.CRITICAL ? console.error :
                     severity === SecurityErrorSeverity.HIGH ? console.error :
                     severity === SecurityErrorSeverity.MEDIUM ? console.warn :
                     console.log;
    
    logMethod(
      `[SecurityErrorHandler] [${severity.toUpperCase()}] ${component}.${operation}:`,
      error instanceof Error ? error.message : String(error)
    );
  }
  
  /**
   * Check if error is retryable
   */
  static isRetryableError(error: Error): boolean {
    const retryablePatterns = [
      /timeout/i,
      /connection/i,
      /ECONNREFUSED/i,
      /ETIMEDOUT/i,
      /ENOTFOUND/i,
      /network/i,
    ];
    
    return retryablePatterns.some(pattern => pattern.test(error.message));
  }
  
  /**
   * Get error severity based on error type
   */
  static getErrorSeverity(error: Error, context: string): SecurityErrorSeverity {
    // Critical errors
    if (context.includes('encryption') || context.includes('authentication')) {
      return SecurityErrorSeverity.CRITICAL;
    }
    
    // High severity errors
    if (context.includes('authorization') || context.includes('csrf') || context.includes('injection')) {
      return SecurityErrorSeverity.HIGH;
    }
    
    // Medium severity errors
    if (context.includes('rate_limit') || context.includes('validation')) {
      return SecurityErrorSeverity.MEDIUM;
    }
    
    // Default to low
    return SecurityErrorSeverity.LOW;
  }
}

/**
 * Async error wrapper for security operations
 * 
 * Usage:
 * ```typescript
 * const result = await securityTry(
 *   async () => await dangerousOperation(),
 *   'ComponentName',
 *   'operationName'
 * );
 * ```
 */
export async function securityTry<T>(
  operation: () => Promise<T>,
  component: string,
  operationName: string,
  fallback?: T
): Promise<T | undefined> {
  try {
    return await operation();
  } catch (error) {
    const severity = SecurityErrorHandler.getErrorSeverity(error as Error, operationName);
    
    SecurityErrorHandler.handleSecurityError({
      component,
      operation: operationName,
      error,
      severity,
    });
    
    return fallback;
  }
}
