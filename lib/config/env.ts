/**
 * Environment Variables Validation and Configuration
 * 
 * Uses Zod for runtime validation of environment variables to ensure
 * all required secrets and configurations are properly set.
 * 
 * This prevents runtime errors and security issues from missing or
 * improperly formatted environment variables.
 */

import { z } from 'zod';

/**
 * Environment variable schema with validation rules
 */
const envSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Database Configuration
  DATABASE_URL: z.string().url().describe('PostgreSQL connection string'),
  POSTGRES_URL: z.string().url().describe('PostgreSQL connection string (alternative)'),
  
  // Redis Configuration
  REDIS_HOST: z.string().min(1).describe('Redis host address'),
  REDIS_PORT: z.string().regex(/^\d+$/).transform(Number).describe('Redis port number'),
  REDIS_PASSWORD: z.string().min(1).optional().describe('Redis password'),
  
  // Authentication & Security
  AUTH_SECRET: z.string()
    .min(32)
    .describe('Secret key for JWT signing (minimum 32 characters)'),
  
  // Application URLs
  BASE_URL: z.string().url().describe('Base URL of the application'),
  NEXT_PUBLIC_APP_URL: z.string().url().describe('Public-facing app URL'),
  
  // Email Configuration (SMTP)
  SMTP_HOST: z.string().min(1).optional().describe('SMTP server host'),
  SMTP_PORT: z.string().regex(/^\d+$/).transform(Number).optional().describe('SMTP server port'),
  SMTP_SECURE: z.enum(['true', 'false']).transform(val => val === 'true').optional().describe('Use TLS for SMTP'),
  SMTP_USER: z.string().email().optional().describe('SMTP authentication username'),
  SMTP_PASSWORD: z.string().optional().describe('SMTP authentication password'),
  EMAIL_FROM: z.string().optional().describe('Default sender email address'),
  
  // Optional: Monitoring & Observability
  SENTRY_DSN: z.string().url().optional().describe('Sentry DSN for error tracking'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  
  // Optional: Storage Configuration
  AWS_ACCESS_KEY_ID: z.string().optional().describe('AWS access key for S3 storage'),
  AWS_SECRET_ACCESS_KEY: z.string().optional().describe('AWS secret key for S3 storage'),
  AWS_REGION: z.string().optional().describe('AWS region'),
  AWS_S3_BUCKET: z.string().optional().describe('S3 bucket name for file storage'),
  
  // Optional: API Keys for Integrations
  GITHUB_CLIENT_ID: z.string().optional().describe('GitHub OAuth client ID'),
  GITHUB_CLIENT_SECRET: z.string().optional().describe('GitHub OAuth client secret'),
  GITLAB_CLIENT_ID: z.string().optional().describe('GitLab OAuth client ID'),
  GITLAB_CLIENT_SECRET: z.string().optional().describe('GitLab OAuth client secret'),
  JIRA_CLIENT_ID: z.string().optional().describe('Jira OAuth client ID'),
  JIRA_CLIENT_SECRET: z.string().optional().describe('Jira OAuth client secret'),
  
  // Optional: Rate Limiting
  RATE_LIMIT_MAX: z.string().regex(/^\d+$/).transform(Number).optional().describe('Default rate limit max requests'),
  RATE_LIMIT_WINDOW: z.string().regex(/^\d+$/).transform(Number).optional().describe('Rate limit window in seconds'),
  
  // Optional: Session Configuration
  SESSION_MAX_AGE: z.string().regex(/^\d+$/).transform(Number).default('604800').describe('Session max age in seconds (default: 7 days)'),
  SESSION_UPDATE_AGE: z.string().regex(/^\d+$/).transform(Number).default('86400').describe('Session update age in seconds (default: 1 day)'),
});

/**
 * Parsed and validated environment variables
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Parse and validate environment variables
 * Throws an error if validation fails
 */
function parseEnv(): Env {
  try {
    const parsed = envSchema.parse(process.env);
    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment variable validation failed:');
      console.error('');
      
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        console.error(`  ❌ ${path}: ${err.message}`);
      });
      
      console.error('');
      console.error('Please check your .env file and ensure all required variables are set correctly.');
      console.error('');
      
      throw new Error('Invalid environment variables');
    }
    throw error;
  }
}

/**
 * Validated environment variables
 * 
 * This will throw an error at startup if any required variables are missing
 * or invalid, preventing the application from running in an insecure state.
 */
export const env = parseEnv();

/**
 * Check if specific optional features are configured
 */
export const features = {
  email: Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD),
  s3Storage: Boolean(env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY && env.AWS_S3_BUCKET),
  githubIntegration: Boolean(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET),
  gitlabIntegration: Boolean(env.GITLAB_CLIENT_ID && env.GITLAB_CLIENT_SECRET),
  jiraIntegration: Boolean(env.JIRA_CLIENT_ID && env.JIRA_CLIENT_SECRET),
  monitoring: Boolean(env.SENTRY_DSN),
} as const;

/**
 * Database configuration
 */
export const databaseConfig = {
  url: env.DATABASE_URL,
  postgresUrl: env.POSTGRES_URL,
  maxConnections: 20,
  idleTimeout: 30000,
  connectionTimeout: 10000,
} as const;

/**
 * Redis configuration
 */
export const redisConfig = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
} as const;

/**
 * Authentication configuration
 */
export const authConfig = {
  secret: env.AUTH_SECRET,
  sessionMaxAge: env.SESSION_MAX_AGE,
  sessionUpdateAge: env.SESSION_UPDATE_AGE,
  
  // Password requirements
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
  },
  
  // Account lockout settings
  accountLockout: {
    maxFailedAttempts: 5,
    lockoutDurationMinutes: 30,
    resetAfterMinutes: 60,
  },
  
  // JWT settings
  jwt: {
    algorithm: 'HS256' as const,
    issuer: env.BASE_URL,
    audience: env.BASE_URL,
  },
} as const;

/**
 * Email configuration
 */
export const emailConfig = {
  enabled: features.email,
  smtp: {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: env.SMTP_USER && env.SMTP_PASSWORD ? {
      user: env.SMTP_USER,
      pass: env.SMTP_PASSWORD,
    } : undefined,
  },
  from: env.EMAIL_FROM || 'noreply@appcompatcheck.com',
} as const;

/**
 * Application URLs
 */
export const urls = {
  base: env.BASE_URL,
  public: env.NEXT_PUBLIC_APP_URL,
  api: `${env.BASE_URL}/api`,
} as const;

/**
 * Rate limiting configuration
 */
export const rateLimitConfig = {
  auth: {
    maxRequests: env.RATE_LIMIT_MAX || 5,
    windowSeconds: env.RATE_LIMIT_WINDOW || 900, // 15 minutes
  },
  api: {
    maxRequests: env.RATE_LIMIT_MAX || 100,
    windowSeconds: 60, // 1 minute
  },
} as const;

/**
 * Logging configuration
 */
export const loggingConfig = {
  level: env.LOG_LEVEL,
  prettyPrint: env.NODE_ENV === 'development',
  redactPaths: [
    'password',
    'token',
    'secret',
    'authorization',
    'cookie',
  ],
} as const;

/**
 * Security configuration
 */
export const securityConfig = {
  // CORS settings
  cors: {
    origin: env.NODE_ENV === 'production' 
      ? [env.BASE_URL, env.NEXT_PUBLIC_APP_URL]
      : '*',
    credentials: true,
  },
  
  // CSRF protection
  csrf: {
    enabled: env.NODE_ENV === 'production',
    cookieName: '__Host-csrf',
    headerName: 'x-csrf-token',
  },
  
  // Cookie settings
  cookies: {
    secure: env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    domain: env.NODE_ENV === 'production' ? new URL(env.BASE_URL).hostname : undefined,
  },
} as const;

/**
 * Validation helper: Ensure critical secrets are not using default/weak values
 */
export function validateSecrets(): void {
  const weakSecrets = [
    'secret',
    'password',
    'changeme',
    '12345678',
    'default',
  ];
  
  if (weakSecrets.some(weak => env.AUTH_SECRET.toLowerCase().includes(weak))) {
    console.warn('⚠️  WARNING: AUTH_SECRET appears to be weak or default. Please use a strong, random secret.');
  }
  
  if (env.AUTH_SECRET.length < 64) {
    console.warn('⚠️  WARNING: AUTH_SECRET is less than 64 characters. Consider using a longer secret for better security.');
  }
  
  if (env.NODE_ENV === 'production') {
    // In production, enforce stricter requirements
    if (!env.SMTP_HOST && features.email) {
      console.warn('⚠️  WARNING: Email features enabled but SMTP not properly configured.');
    }
  }
}

// Run validation on startup
if (typeof window === 'undefined') {
  // Only run on server-side
  validateSecrets();
  
  console.log('✅ Environment variables validated successfully');
  console.log(`📦 Running in ${env.NODE_ENV} mode`);
  console.log(`🔌 Database: ${env.DATABASE_URL.split('@')[1]?.split('/')[0] || 'configured'}`);
  console.log(`🔴 Redis: ${env.REDIS_HOST}:${env.REDIS_PORT}`);
  console.log(`📧 Email: ${features.email ? 'enabled' : 'disabled'}`);
  console.log(`☁️  S3 Storage: ${features.s3Storage ? 'enabled' : 'disabled'}`);
  console.log('');
}

/**
 * Export everything for easy access
 */
export default {
  env,
  features,
  databaseConfig,
  redisConfig,
  authConfig,
  emailConfig,
  urls,
  rateLimitConfig,
  loggingConfig,
  securityConfig,
  validateSecrets,
};
