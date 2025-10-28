'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CircleIcon, Loader2 } from 'lucide-react';
import { resetPassword } from './actions';
import { ActionState } from '@/lib/auth/middleware';

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    resetPassword,
    { error: '' }
  );

  if (!token) {
    return (
      <div className="min-h-[100dvh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <CircleIcon className="h-12 w-12 text-primary" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
            Invalid Reset Link
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            This password reset link is invalid or has expired.
          </p>
          <div className="mt-6 text-center">
            <Link
              href="/forgot-password"
              className="text-primary hover:underline"
            >
              Request a new reset link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <CircleIcon className="h-12 w-12 text-primary" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
          Set New Password
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Enter your new password below.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <form className="space-y-6" action={formAction}>
          <input type="hidden" name="token" value={token} />
          
          <div>
            <Label
              htmlFor="password"
              className="block text-sm font-medium text-foreground"
            >
              New Password
            </Label>
            <div className="mt-1">
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                defaultValue={state.password}
                required
                minLength={8}
                maxLength={100}
                className="rounded-full"
                placeholder="Enter your new password"
              />
            </div>
          </div>

          <div>
            <Label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-foreground"
            >
              Confirm New Password
            </Label>
            <div className="mt-1">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                defaultValue={state.confirmPassword}
                required
                minLength={8}
                maxLength={100}
                className="rounded-full"
                placeholder="Confirm your new password"
              />
            </div>
          </div>

          {state?.error && (
            <div className="text-destructive text-sm">{state.error}</div>
          )}

          {state?.success && (
            <div className="text-green-600 text-sm bg-green-50 p-3 rounded-md">
              {state.success}
              <div className="mt-2">
                <Link href="/sign-in" className="underline font-medium">
                  Go to Sign In
                </Link>
              </div>
            </div>
          )}

          <div>
            <Button
              type="submit"
              className="w-full rounded-full"
              disabled={pending}
            >
              {pending ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  Resetting...
                </>
              ) : (
                'Reset Password'
              )}
            </Button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background text-muted-foreground">
                Remember your password?
              </span>
            </div>
          </div>

          <div className="mt-6">
            <Link
              href="/sign-in"
              className="w-full flex justify-center py-2 px-4 border border-input rounded-full shadow-sm text-sm font-medium text-foreground bg-background hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
