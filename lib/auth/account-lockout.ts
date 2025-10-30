/**
 * Account Lockout Mechanism
 * 
 * Prevents brute force attacks by temporarily locking accounts
 * after multiple failed login attempts.
 * 
 * Features:
 * - Track failed login attempts
 * - Progressive lockout duration
 * - Automatic unlocking after timeout
 * - Manual unlock by admins
 */

import { redis } from '@/lib/db/redis';
import { accountLockoutConfig } from './config';

/**
 * Account lockout status
 */
export interface LockoutStatus {
  /**
   * Whether the account is currently locked
   */
  locked: boolean;
  
  /**
   * Number of failed attempts
   */
  failedAttempts: number;
  
  /**
   * Unix timestamp when the account was locked (if locked)
   */
  lockedAt?: number;
  
  /**
   * Unix timestamp when the lockout will expire
   */
  lockedUntil?: number;
  
  /**
   * Number of minutes until unlock (if locked)
   */
  remainingMinutes?: number;
  
  /**
   * Number of lockout cycles (for progressive lockout)
   */
  lockoutCount: number;
}

/**
 * Get Redis keys for account lockout tracking
 */
function getLockoutKeys(identifier: string) {
  return {
    failedAttempts: `lockout:failed:${identifier}`,
    lockUntil: `lockout:until:${identifier}`,
    lockoutCount: `lockout:count:${identifier}`,
  };
}

/**
 * Record a failed login attempt
 * 
 * @param identifier - User email or ID
 * @returns Updated lockout status
 */
export async function recordFailedAttempt(identifier: string): Promise<LockoutStatus> {
  const keys = getLockoutKeys(identifier);
  const now = Date.now();
  
  try {
    // Check if account is currently locked
    const lockedUntil = await redis.get(keys.lockUntil);
    if (lockedUntil) {
      const lockExpiry = parseInt(lockedUntil, 10);
      if (lockExpiry > now) {
        // Account is still locked
        const lockoutCount = parseInt(await redis.get(keys.lockoutCount) || '0', 10);
        const remainingMinutes = Math.ceil((lockExpiry - now) / 1000 / 60);
        
        return {
          locked: true,
          failedAttempts: accountLockoutConfig.maxFailedAttempts,
          lockedAt: lockExpiry - (getLockoutDuration(lockoutCount) * 60 * 1000),
          lockedUntil: lockExpiry,
          remainingMinutes,
          lockoutCount,
        };
      } else {
        // Lockout has expired, clean up
        await redis.del(keys.lockUntil);
      }
    }
    
    // Increment failed attempts
    const failedAttempts = await redis.incr(keys.failedAttempts);
    
    // Set expiry on failed attempts counter (reset after configured time)
    await redis.expire(
      keys.failedAttempts,
      accountLockoutConfig.resetAfterMinutes * 60
    );
    
    // Check if we should lock the account
    if (failedAttempts >= accountLockoutConfig.maxFailedAttempts) {
      // Get current lockout count for progressive lockout
      const lockoutCount = parseInt(await redis.get(keys.lockoutCount) || '0', 10);
      const newLockoutCount = lockoutCount + 1;
      
      // Calculate lockout duration (progressive if enabled)
      const lockoutDuration = getLockoutDuration(newLockoutCount);
      const lockUntil = now + (lockoutDuration * 60 * 1000);
      
      // Lock the account
      await redis.set(
        keys.lockUntil,
        lockUntil.toString(),
        'EX',
        lockoutDuration * 60
      );
      
      // Update lockout count
      await redis.set(
        keys.lockoutCount,
        newLockoutCount.toString(),
        'EX',
        24 * 60 * 60 // Expire after 24 hours
      );
      
      // Reset failed attempts counter
      await redis.del(keys.failedAttempts);
      
      return {
        locked: true,
        failedAttempts: accountLockoutConfig.maxFailedAttempts,
        lockedAt: now,
        lockedUntil: lockUntil,
        remainingMinutes: lockoutDuration,
        lockoutCount: newLockoutCount,
      };
    }
    
    // Account not locked yet
    return {
      locked: false,
      failedAttempts,
      lockoutCount: 0,
    };
  } catch (error) {
    console.error('Error recording failed attempt:', error);
    // Fail open: don't lock the account if Redis is unavailable
    return {
      locked: false,
      failedAttempts: 0,
      lockoutCount: 0,
    };
  }
}

/**
 * Record a successful login (reset failed attempts)
 * 
 * @param identifier - User email or ID
 */
export async function recordSuccessfulLogin(identifier: string): Promise<void> {
  const keys = getLockoutKeys(identifier);
  
  try {
    // Clear failed attempts
    await redis.del(keys.failedAttempts);
    
    // Keep lockout count for tracking (but it will expire after 24h)
    // This helps with progressive lockout over time
  } catch (error) {
    console.error('Error recording successful login:', error);
  }
}

/**
 * Check if account is locked
 * 
 * @param identifier - User email or ID
 * @returns Lockout status
 */
export async function checkLockoutStatus(identifier: string): Promise<LockoutStatus> {
  const keys = getLockoutKeys(identifier);
  const now = Date.now();
  
  try {
    // Check if account is locked
    const lockedUntil = await redis.get(keys.lockUntil);
    if (lockedUntil) {
      const lockExpiry = parseInt(lockedUntil, 10);
      if (lockExpiry > now) {
        // Account is locked
        const failedAttempts = parseInt(await redis.get(keys.failedAttempts) || '0', 10);
        const lockoutCount = parseInt(await redis.get(keys.lockoutCount) || '0', 10);
        const remainingMinutes = Math.ceil((lockExpiry - now) / 1000 / 60);
        
        return {
          locked: true,
          failedAttempts: Math.max(failedAttempts, accountLockoutConfig.maxFailedAttempts),
          lockedAt: lockExpiry - (getLockoutDuration(lockoutCount) * 60 * 1000),
          lockedUntil: lockExpiry,
          remainingMinutes,
          lockoutCount,
        };
      } else {
        // Lockout expired, clean up
        await redis.del(keys.lockUntil);
      }
    }
    
    // Get current failed attempts
    const failedAttempts = parseInt(await redis.get(keys.failedAttempts) || '0', 10);
    const lockoutCount = parseInt(await redis.get(keys.lockoutCount) || '0', 10);
    
    return {
      locked: false,
      failedAttempts,
      lockoutCount,
    };
  } catch (error) {
    console.error('Error checking lockout status:', error);
    // Fail open: allow login if Redis is unavailable
    return {
      locked: false,
      failedAttempts: 0,
      lockoutCount: 0,
    };
  }
}

/**
 * Calculate lockout duration based on lockout count (progressive lockout)
 * 
 * @param lockoutCount - Number of times account has been locked
 * @returns Lockout duration in minutes
 */
function getLockoutDuration(lockoutCount: number): number {
  if (!accountLockoutConfig.progressive) {
    return accountLockoutConfig.lockoutDurationMinutes;
  }
  
  // Progressive lockout: increase duration with each lockout
  const baseDuration = accountLockoutConfig.lockoutDurationMinutes;
  const multiplier = Math.pow(accountLockoutConfig.progressiveMultiplier, lockoutCount);
  const duration = Math.round(baseDuration * multiplier);
  
  // Cap at maximum duration
  return Math.min(duration, accountLockoutConfig.maxLockoutDurationMinutes);
}

/**
 * Manually unlock an account (admin function)
 * 
 * @param identifier - User email or ID
 */
export async function unlockAccount(identifier: string): Promise<void> {
  const keys = getLockoutKeys(identifier);
  
  try {
    // Clear all lockout data
    await redis.del(keys.failedAttempts);
    await redis.del(keys.lockUntil);
    await redis.del(keys.lockoutCount);
  } catch (error) {
    console.error('Error unlocking account:', error);
    throw new Error('Failed to unlock account');
  }
}

/**
 * Reset failed attempts counter (without unlocking)
 * 
 * @param identifier - User email or ID
 */
export async function resetFailedAttempts(identifier: string): Promise<void> {
  const keys = getLockoutKeys(identifier);
  
  try {
    await redis.del(keys.failedAttempts);
  } catch (error) {
    console.error('Error resetting failed attempts:', error);
  }
}

/**
 * Get all locked accounts (admin function)
 * 
 * Warning: This can be expensive with many users
 */
export async function getAllLockedAccounts(): Promise<string[]> {
  try {
    const keys = await redis.keys('lockout:until:*');
    const lockedAccounts: string[] = [];
    const now = Date.now();
    
    for (const key of keys) {
      const lockedUntil = await redis.get(key);
      if (lockedUntil && parseInt(lockedUntil, 10) > now) {
        // Extract identifier from key
        const identifier = key.replace('lockout:until:', '');
        lockedAccounts.push(identifier);
      }
    }
    
    return lockedAccounts;
  } catch (error) {
    console.error('Error getting locked accounts:', error);
    return [];
  }
}

/**
 * Get lockout statistics for monitoring
 */
export async function getLockoutStatistics(): Promise<{
  totalLockedAccounts: number;
  totalFailedAttempts: number;
  averageFailedAttempts: number;
}> {
  try {
    const lockedKeys = await redis.keys('lockout:until:*');
    const failedKeys = await redis.keys('lockout:failed:*');
    
    const now = Date.now();
    let activeLocks = 0;
    
    for (const key of lockedKeys) {
      const lockedUntil = await redis.get(key);
      if (lockedUntil && parseInt(lockedUntil, 10) > now) {
        activeLocks++;
      }
    }
    
    let totalFailedAttempts = 0;
    for (const key of failedKeys) {
      const attempts = await redis.get(key);
      if (attempts) {
        totalFailedAttempts += parseInt(attempts, 10);
      }
    }
    
    const averageFailedAttempts = failedKeys.length > 0 
      ? totalFailedAttempts / failedKeys.length 
      : 0;
    
    return {
      totalLockedAccounts: activeLocks,
      totalFailedAttempts,
      averageFailedAttempts: Math.round(averageFailedAttempts * 100) / 100,
    };
  } catch (error) {
    console.error('Error getting lockout statistics:', error);
    return {
      totalLockedAccounts: 0,
      totalFailedAttempts: 0,
      averageFailedAttempts: 0,
    };
  }
}

/**
 * Middleware-style lockout checker
 * 
 * Returns error response if account is locked, null if not locked
 */
export async function checkAccountLockout(identifier: string): Promise<{
  locked: boolean;
  response?: Response;
}> {
  const status = await checkLockoutStatus(identifier);
  
  if (status.locked) {
    const response = new Response(
      JSON.stringify({
        error: 'Account locked',
        message: `Your account has been temporarily locked due to multiple failed login attempts. Please try again in ${status.remainingMinutes} minutes.`,
        lockedUntil: new Date(status.lockedUntil!).toISOString(),
        remainingMinutes: status.remainingMinutes,
      }),
      {
        status: 423, // 423 Locked
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': (status.remainingMinutes! * 60).toString(),
        },
      }
    );
    
    return { locked: true, response };
  }
  
  return { locked: false };
}

/**
 * Export configuration for reference
 */
export { accountLockoutConfig };
