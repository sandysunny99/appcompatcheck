'use server';

import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import crypto from 'crypto';
import { redis } from '@/lib/db/redis';
import {
  User,
  users,
  activityLogs,
  type NewUser,
  type NewActivityLog,
  ActivityType,
} from '@/lib/db/schema';
import { comparePasswords, hashPassword, setSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getUser } from '@/lib/db/queries';
import {
  validatedAction,
  validatedActionWithUser
} from '@/lib/auth/middleware';
import { sendWelcomeEmail, sendPasswordResetEmail } from '@/lib/email';

async function logActivity(
  userId: number,
  type: ActivityType,
  ipAddress?: string,
  metadata?: string
) {
  try {
    const newActivity: NewActivityLog = {
      userId,
      action: type,
      entityType: 'USER',
      ipAddress: ipAddress || null,
      metadata: metadata ? { description: metadata } : null
    };
    await db.insert(activityLogs).values(newActivity);
  } catch (error) {
    console.error('Failed to log activity:', error);
    // Don't throw - activity logging should not break main functionality
  }
}

const signInSchema = z.object({
  email: z.string().email().min(3).max(255),
  password: z.string().min(8).max(100)
});

export const signIn = validatedAction(signInSchema, async (data, formData) => {
  try {
    const { email, password } = data;

    const foundUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (foundUser.length === 0) {
      return {
        error: 'Invalid email or password. Please try again.',
        email,
        password
      };
    }

    const user = foundUser[0];

    if (!user || !user.passwordHash) {
      return {
        error: 'Invalid email or password. Please try again.',
        email,
        password
      };
    }

    const isPasswordValid = await comparePasswords(
      password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      return {
        error: 'Invalid email or password. Please try again.',
        email,
        password
      };
    }

    await Promise.all([
      setSession(user),
      logActivity(user.id, ActivityType.SIGN_IN)
    ]);

    // Get redirect parameter from form data, default to home page
    const redirectTo = formData.get('redirect') as string || '/';
    redirect(redirectTo);
  } catch (error) {
    // Check if this is a redirect error (which is expected behavior)
    if (error && typeof error === 'object' && 'digest' in error && 
        typeof (error as any).digest === 'string' && 
        (error as any).digest.startsWith('NEXT_REDIRECT')) {
      throw error; // Re-throw redirect errors so Next.js can handle them
    }
    console.error('[SignIn] Error during sign in:', error);
    return {
      error: 'An unexpected error occurred. Please try again.',
      email: data.email,
      password: data.password
    };
  }
});

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string().min(8)
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const signUp = validatedAction(signUpSchema, async (data, formData) => {
  const { email, password, confirmPassword } = data;

  try {
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return {
        error: 'An account with this email already exists. Please sign in instead.',
        email,
        password,
        confirmPassword
      };
    }

    const passwordHash = await hashPassword(password);

    const newUser: NewUser = {
      email,
      passwordHash,
      name: null
    };

    const [createdUser] = await db.insert(users).values(newUser).returning();

    if (!createdUser) {
      return {
        error: 'Failed to create user. Please try again.',
        email,
        password,
        confirmPassword
      };
    }
    
    // Send welcome email (don't await to avoid blocking)
    sendWelcomeEmail(createdUser.email, createdUser.name || 'User').catch(err => 
      console.error('Failed to send welcome email:', err)
    );
    
    await Promise.all([
      logActivity(createdUser.id, ActivityType.SIGN_UP),
      setSession(createdUser)
    ]);
  } catch (error) {
    // Check if this is a redirect error (which is expected)
    if (error && typeof error === 'object' && 'digest' in error && 
        typeof (error as any).digest === 'string' && 
        (error as any).digest.startsWith('NEXT_REDIRECT')) {
      throw error; // Re-throw redirect errors
    }
    console.error('[SignUp] Error during sign up:', error);
    return {
      error: 'An unexpected error occurred. Please try again.',
      email,
      password,
      confirmPassword
    };
  }
  
  // Redirect outside try-catch to avoid catching it
  redirect('/');
});

export async function signOut() {
  const user = (await getUser()) as User;
  await logActivity(user.id, ActivityType.SIGN_OUT);
  (await cookies()).delete('session');
}

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(8).max(100),
  newPassword: z.string().min(8).max(100),
  confirmPassword: z.string().min(8).max(100)
});

export const updatePassword = validatedActionWithUser(
  updatePasswordSchema,
  async (data, _, user) => {
    const { currentPassword, newPassword, confirmPassword } = data;

    const isPasswordValid = await comparePasswords(
      currentPassword,
      user.passwordHash
    );

    if (!isPasswordValid) {
      return {
        currentPassword,
        newPassword,
        confirmPassword,
        error: 'Current password is incorrect.'
      };
    }

    if (currentPassword === newPassword) {
      return {
        currentPassword,
        newPassword,
        confirmPassword,
        error: 'New password must be different from the current password.'
      };
    }

    if (confirmPassword !== newPassword) {
      return {
        currentPassword,
        newPassword,
        confirmPassword,
        error: 'New password and confirmation password do not match.'
      };
    }

    const newPasswordHash = await hashPassword(newPassword);

    await Promise.all([
      db
        .update(users)
        .set({ passwordHash: newPasswordHash })
        .where(eq(users.id, user.id)),
      logActivity(user.id, ActivityType.UPDATE_PASSWORD)
    ]);

    return {
      success: 'Password updated successfully.'
    };
  }
);

const deleteAccountSchema = z.object({
  password: z.string().min(8).max(100)
});

export const deleteAccount = validatedActionWithUser(
  deleteAccountSchema,
  async (data, _, user) => {
    const { password } = data;

    const isPasswordValid = await comparePasswords(password, user.passwordHash);
    if (!isPasswordValid) {
      return {
        password,
        error: 'Incorrect password. Please try again.'
      };
    }

    await Promise.all([
      db
        .update(users)
        .set({ deletedAt: new Date() })
        .where(eq(users.id, user.id)),
      logActivity(user.id, ActivityType.DELETE_ACCOUNT)
    ]);

    (await cookies()).delete('session');
    redirect('/sign-in');
  }
);

const updateAccountSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().min(3).max(255)
});

export const updateAccount = validatedActionWithUser(
  updateAccountSchema,
  async (data, _, user) => {
    const { name, email } = data;

    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0 && existingUser[0].id !== user.id) {
      return {
        name,
        email,
        error: 'Email is already in use.'
      };
    }

    await Promise.all([
      db.update(users).set({ name, email }).where(eq(users.id, user.id)),
      logActivity(user.id, ActivityType.UPDATE_ACCOUNT)
    ]);

    return {
      success: 'Account updated successfully.'
    };
  }
);

// Forgot Password Action
const forgotPasswordSchema = z.object({
  email: z.string().email().min(3).max(255)
});

export const forgotPassword = validatedAction(
  forgotPasswordSchema,
  async (data, formData) => {
    const { email } = data;

    try {
      const foundUser = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      // Always return success to prevent email enumeration
      if (foundUser.length === 0) {
        return {
          success:
            'If an account with that email exists, we have sent a password reset link.'
        };
      }

      const user = foundUser[0];

      // Generate reset token (random string)
      const resetToken = crypto.randomBytes(32).toString('hex');
      
      // Store reset token in Redis with 1 hour expiry
      await redis.setex(
        `password_reset:${resetToken}`,
        3600, // 1 hour in seconds
        user.id.toString()
      );

      // Send password reset email (don't await to avoid blocking)
      sendPasswordResetEmail(
        user.email,
        user.name || 'User',
        resetToken
      ).catch(err => console.error('Failed to send password reset email:', err));
      
      // Log reset link for development
      console.log(`Password reset token for ${email}: ${resetToken}`);
      console.log(
        `Reset link: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`
      );

      return {
        success:
          'If an account with that email exists, we have sent a password reset link.'
      };
    } catch (error) {
      console.error('[ForgotPassword] Error:', error);
      return {
        error: 'An error occurred. Please try again.'
      };
    }
  }
);

// Reset Password Action
const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(100),
  confirmPassword: z.string().min(8).max(100)
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const resetPassword = validatedAction(
  resetPasswordSchema,
  async (data, formData) => {
    const { token, password, confirmPassword } = data;

    try {
      // Check if token exists in Redis
      const userId = await redis.get(`password_reset:${token}`);

      if (!userId) {
        return {
          error: 'Invalid or expired reset token.',
          token,
          password,
          confirmPassword
        };
      }

      // Get user by ID
      const foundUser = await db
        .select()
        .from(users)
        .where(eq(users.id, parseInt(userId)))
        .limit(1);

      if (foundUser.length === 0) {
        return {
          error: 'User not found.',
          token,
          password,
          confirmPassword
        };
      }

      const user = foundUser[0];

      // Hash new password
      const newPasswordHash = await hashPassword(password);

      // Update password
      await db
        .update(users)
        .set({
          passwordHash: newPasswordHash
        })
        .where(eq(users.id, user.id));
      
      // Delete the reset token from Redis
      await redis.del(`password_reset:${token}`);

      await logActivity(user.id, ActivityType.UPDATE_PASSWORD);

      return {
        success: 'Password reset successfully. You can now sign in.'
      };
    } catch (error) {
      console.error('[ResetPassword] Error:', error);
      return {
        error: 'An error occurred. Please try again.',
        token,
        password,
        confirmPassword
      };
    }
  }
);