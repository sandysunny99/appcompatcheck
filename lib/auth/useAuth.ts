'use client';

import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { SessionData } from './session';

interface AuthContextType {
  user: SessionData['user'] | null;
  session: SessionData | null;
  token: string | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionData | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setSession(data.session);
        setToken(data.token);
      } else {
        setSession(null);
        setToken(null);
      }
    } catch (error) {
      console.error('Failed to refresh session:', error);
      setSession(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const response = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Sign in failed');
    }

    await refresh();
  };

  const signOut = async () => {
    try {
      await fetch('/api/auth/signout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setSession(null);
      setToken(null);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const value: AuthContextType = {
    user: session?.user || null,
    session,
    token,
    isLoading,
    signIn,
    signOut,
    refresh,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}