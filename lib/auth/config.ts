/**
 * Authentication Configuration
 * 
 * Centralized configuration for authentication, session management,
 * and security settings.
 */

import { authConfig, securityConfig } from '@/lib/config/env';

/**
 * Session configuration
 */
export const sessionConfig = {
  /**
   * Maximum age of session in seconds
   * Default: 7 days (604800 seconds)
   */
  maxAge: authConfig.sessionMaxAge,
  
  /**
   * How often to update the session in seconds
   * Default: 1 day (86400 seconds)
   */
  updateAge: authConfig.sessionUpdateAge,
  
  /**
   * Cookie name for session
   */
  cookieName: securityConfig.cookies.secure ? '__Host-session' : 'session',
  
  /**
   * Cookie options
   */
  cookie: {
    httpOnly: securityConfig.cookies.httpOnly,
    secure: securityConfig.cookies.secure,
    sameSite: securityConfig.cookies.sameSite,
    domain: securityConfig.cookies.domain,
    path: '/',
  },
  
  /**
   * Whether to generate a new session ID on login
   * Prevents session fixation attacks
   */
  regenerateOnLogin: true,
  
  /**
   * Whether to destroy session on logout
   */
  destroyOnLogout: true,
  
  /**
   * Rolling sessions: extend session on activity
   */
  rolling: true,
} as const;

/**
 * Password policy configuration
 */
export const passwordPolicy = {
  /**
   * Minimum password length
   */
  minLength: authConfig.password.minLength,
  
  /**
   * Require at least one uppercase letter
   */
  requireUppercase: authConfig.password.requireUppercase,
  
  /**
   * Require at least one lowercase letter
   */
  requireLowercase: authConfig.password.requireLowercase,
  
  /**
   * Require at least one number
   */
  requireNumbers: authConfig.password.requireNumbers,
  
  /**
   * Require at least one special character
   */
  requireSpecialChars: authConfig.password.requireSpecialChars,
  
  /**
   * Special characters that are accepted
   */
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  
  /**
   * Maximum password length (prevent DoS via bcrypt)
   */
  maxLength: 72,
  
  /**
   * Password history: number of previous passwords to check
   */
  historyCount: 5,
  
  /**
   * Password expiration in days (0 = never expires)
   */
  expirationDays: 90,
  
  /**
   * Minimum time between password changes (in minutes)
   */
  minChangeIntervalMinutes: 1,
} as const;

/**
 * Account lockout configuration
 */
export const accountLockoutConfig = {
  /**
   * Maximum failed login attempts before lockout
   */
  maxFailedAttempts: authConfig.accountLockout.maxFailedAttempts,
  
  /**
   * Lockout duration in minutes
   */
  lockoutDurationMinutes: authConfig.accountLockout.lockoutDurationMinutes,
  
  /**
   * Reset failed attempts counter after this many minutes of no failed attempts
   */
  resetAfterMinutes: authConfig.accountLockout.resetAfterMinutes,
  
  /**
   * Whether to notify user via email on lockout
   */
  notifyOnLockout: true,
  
  /**
   * Progressive lockout: increase lockout duration with each subsequent lockout
   */
  progressive: true,
  
  /**
   * Multiplier for progressive lockout (each lockout increases duration by this factor)
   */
  progressiveMultiplier: 2,
  
  /**
   * Maximum lockout duration in minutes (cap for progressive lockout)
   */
  maxLockoutDurationMinutes: 1440, // 24 hours
} as const;

/**
 * JWT (JSON Web Token) configuration
 */
export const jwtConfig = {
  /**
   * Secret key for signing JWTs
   */
  secret: authConfig.secret,
  
  /**
   * Algorithm for signing
   */
  algorithm: authConfig.jwt.algorithm,
  
  /**
   * Token issuer
   */
  issuer: authConfig.jwt.issuer,
  
  /**
   * Token audience
   */
  audience: authConfig.jwt.audience,
  
  /**
   * Access token expiration time
   */
  accessTokenExpiresIn: '15m',
  
  /**
   * Refresh token expiration time
   */
  refreshTokenExpiresIn: '7d',
  
  /**
   * Whether to include user info in token payload
   */
  includeUserInfo: true,
} as const;

/**
 * Multi-factor authentication configuration
 */
export const mfaConfig = {
  /**
   * Whether MFA is enabled
   */
  enabled: false, // Can be enabled in future
  
  /**
   * Whether MFA is required for all users
   */
  required: false,
  
  /**
   * Whether MFA is required for admin users
   */
  requiredForAdmin: true,
  
  /**
   * TOTP (Time-based One-Time Password) settings
   */
  totp: {
    issuer: 'AppCompatCheck',
    digits: 6,
    period: 30, // seconds
    algorithm: 'SHA1' as const,
  },
  
  /**
   * Backup codes configuration
   */
  backupCodes: {
    count: 10,
    length: 8,
  },
} as const;

/**
 * Fallback Configuration
 * 
 * Settings for graceful degradation when external services fail
 */
export const fallbackConfig = {
  /**
   * Enable in-memory fallback for rate limiting when Redis is unavailable
   */
  rateLimitFallbackEnabled: true,
  
  /**
   * Memory store cleanup interval in milliseconds
   */
  memoryStoreCleanupInterval: 5 * 60 * 1000, // 5 minutes
  
  /**
   * Maximum entries in memory fallback store
   */
  maxMemoryStoreSize: 10000,
  
  /**
   * Redis reconnection attempts
   */
  redisReconnectAttempts: 3,
  
  /**
   * Redis reconnection interval in milliseconds
   */
  redisReconnectInterval: 30000, // 30 seconds
  
  /**
   * Fail open (allow requests) or fail closed (block requests) on Redis failure
   * Development: fail open, Production: use fallback
   */
  failMode: process.env.NODE_ENV === 'development' ? 'open' : 'fallback',
} as const;

/**
 * Alert Thresholds Configuration
 * 
 * Defines when to trigger security alerts and notifications
 */
export const alertThresholds = {
  /**
   * Rate Limiting Alerts
   */
  rateLimit: {
    // Alert when rate limit exceeded events exceed this count per 5 minutes
    eventsPerFiveMinutes: 50,
    
    // Alert on sustained high rate limiting (per hour)
    eventsPerHour: 200,
    
    // Critical alert threshold
    criticalEventsPerMinute: 20,
  },
  
  /**
   * Account Lockout Alerts
   */
  accountLockout: {
    // Alert when lockouts exceed this count per hour
    lockoutsPerHour: 10,
    
    // Alert on repeated lockouts for same account
    repeatedLockoutsThreshold: 3,
    
    // Critical: potential targeted attack
    criticalLockoutsPerMinute: 5,
  },
  
  /**
   * Password Policy Alerts
   */
  passwordPolicy: {
    // Alert when weak password attempts exceed threshold
    weakPasswordAttemptsPerHour: 100,
    
    // Alert on common password usage attempts
    commonPasswordAttemptsPerHour: 50,
  },
  
  /**
   * Authentication Alerts
   */
  authentication: {
    // Alert on high failed login rate
    failedLoginsPerHour: 100,
    
    // Alert on potential brute force (same IP)
    failedLoginsPerIPPerMinute: 10,
    
    // Critical: distributed brute force attack
    uniqueIPsFailedLoginsPerMinute: 50,
  },
  
  /**
   * Input Validation Alerts
   */
  inputValidation: {
    // Alert on SQL injection attempts
    sqlInjectionAttemptsPerHour: 20,
    
    // Alert on XSS attempts
    xssAttemptsPerHour: 20,
    
    // Alert on path traversal attempts
    pathTraversalAttemptsPerHour: 10,
  },
  
  /**
   * System Health Alerts
   */
  systemHealth: {
    // Alert when Redis is down for this duration (seconds)
    redisDownSeconds: 60,
    
    // Alert when database errors exceed threshold
    databaseErrorsPerMinute: 5,
    
    // Alert on high memory usage in fallback store
    memoryStoreUsagePercent: 80,
  },
} as const;

/**
 * Security Monitoring Configuration
 */
export const securityMonitoringConfig = {
  /**
   * Enable real-time security monitoring
   */
  enabled: true,
  
  /**
   * Log all security events
   */
  logAllEvents: true,
  
  /**
   * Sampling rate for performance metrics (0-1)
   */
  metricsSamplingRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  /**
   * Event retention period in days
   */
  eventRetentionDays: 90,
  
  /**
   * Alert notification channels
   */
  alertChannels: {
    email: true,
    slack: false, // Configure when available
    webhook: false, // Configure when available
  },
  
  /**
   * Dashboard refresh interval in seconds
   */
  dashboardRefreshInterval: 30,
} as const;

/**
 * OAuth configuration
 */
export const oauthConfig = {
  /**
   * Allowed OAuth providers
   */
  providers: ['github', 'gitlab', 'google'] as const,
  
  /**
   * OAuth state parameter expiration (in seconds)
   */
  stateExpiresIn: 600, // 10 minutes
  
  /**
   * Whether to automatically create user account on OAuth login
   */
  autoCreateUser: true,
  
  /**
   * Whether to link OAuth account to existing user with same email
   */
  linkToExistingUser: true,
} as const;

/**
 * API key configuration
 */
export const apiKeyConfig = {
  /**
   * API key length (in bytes, will be hex encoded)
   */
  keyLength: 32, // Results in 64 character hex string
  
  /**
   * API key prefix for identification
   */
  keyPrefix: 'acc_',
  
  /**
   * Maximum number of API keys per user
   */
  maxKeysPerUser: 10,
  
  /**
   * API key expiration in days (0 = never expires)
   */
  expirationDays: 0,
  
  /**
   * Whether to hash API keys in database
   */
  hashKeys: true,
} as const;

/**
 * Security event types for logging
 */
export const securityEventTypes = {
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILURE: 'login_failure',
  LOGOUT: 'logout',
  PASSWORD_CHANGE: 'password_change',
  PASSWORD_RESET_REQUEST: 'password_reset_request',
  PASSWORD_RESET_SUCCESS: 'password_reset_success',
  ACCOUNT_LOCKED: 'account_locked',
  ACCOUNT_UNLOCKED: 'account_unlocked',
  MFA_ENABLED: 'mfa_enabled',
  MFA_DISABLED: 'mfa_disabled',
  MFA_SUCCESS: 'mfa_success',
  MFA_FAILURE: 'mfa_failure',
  API_KEY_CREATED: 'api_key_created',
  API_KEY_DELETED: 'api_key_deleted',
  PERMISSION_DENIED: 'permission_denied',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
} as const;

/**
 * Rate limiting thresholds for different auth operations
 */
export const authRateLimits = {
  login: {
    maxRequests: 5,
    windowSeconds: 900, // 15 minutes
    blockDurationSeconds: 1800, // 30 minutes
  },
  registration: {
    maxRequests: 3,
    windowSeconds: 3600, // 1 hour
    blockDurationSeconds: 3600, // 1 hour
  },
  passwordReset: {
    maxRequests: 3,
    windowSeconds: 3600, // 1 hour
    blockDurationSeconds: 3600, // 1 hour
  },
  emailVerification: {
    maxRequests: 5,
    windowSeconds: 3600, // 1 hour
    blockDurationSeconds: 1800, // 30 minutes
  },
} as const;

/**
 * Bcrypt configuration for password hashing
 */
export const bcryptConfig = {
  /**
   * Number of salt rounds
   * Higher = more secure but slower
   * 10 rounds = ~10 hashes per second (good for most applications)
   */
  saltRounds: 10,
} as const;

/**
 * Session storage configuration
 */
export const sessionStorageConfig = {
  /**
   * Where to store sessions
   * 'redis' = Redis (recommended for production)
   * 'memory' = In-memory (only for development)
   */
  type: process.env.NODE_ENV === 'production' ? 'redis' : 'redis',
  
  /**
   * Key prefix for session storage
   */
  keyPrefix: 'session:',
  
  /**
   * Whether to compress session data
   */
  compress: true,
} as const;

/**
 * CSRF protection configuration
 */
export const csrfConfig = {
  /**
   * Whether CSRF protection is enabled
   */
  enabled: securityConfig.csrf.enabled,
  
  /**
   * Cookie name for CSRF token
   */
  cookieName: securityConfig.csrf.cookieName,
  
  /**
   * Header name for CSRF token
   */
  headerName: securityConfig.csrf.headerName,
  
  /**
   * Token length (in bytes, will be hex encoded)
   */
  tokenLength: 32, // Results in 64 character hex string
  
  /**
   * Token expiration in minutes
   */
  tokenExpiresIn: 60, // 1 hour
  
  /**
   * Whether to use double submit cookie pattern
   */
  doubleSubmit: true,
  
  /**
   * Methods that require CSRF protection
   */
  protectedMethods: ['POST', 'PUT', 'PATCH', 'DELETE'] as const,
  
  /**
   * Paths that are exempt from CSRF protection
   */
  exemptPaths: [
    '/api/webhooks/',
    '/api/auth/callback/',
  ] as const,
} as const;

/**
 * Export all configuration
 */
export const authConfiguration = {
  session: sessionConfig,
  password: passwordPolicy,
  accountLockout: accountLockoutConfig,
  jwt: jwtConfig,
  mfa: mfaConfig,
  oauth: oauthConfig,
  apiKey: apiKeyConfig,
  securityEvents: securityEventTypes,
  rateLimits: authRateLimits,
  bcrypt: bcryptConfig,
  sessionStorage: sessionStorageConfig,
  csrf: csrfConfig,
} as const;

export default authConfiguration;
