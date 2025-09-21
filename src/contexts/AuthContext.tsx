'use client';

import React, { createContext, useContext } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Session } from 'next-auth';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  
  // Convert NextAuth session to our User format
  const user: User | null = session?.user ? {
    id: session.user.id,
    email: session.user.email!,
    name: session.user.name || undefined
  } : null;
  
  const loading = status === 'loading';

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      
      return result?.ok === true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (
    email: string,
    password: string,
    name?: string
  ): Promise<boolean> => {
    try {
      // First register the user
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      if (response.ok) {
        // After successful registration, sign in with NextAuth
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });
        
        return result?.ok === true;
      }
      return false;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    await signOut({ redirect: false });
  };

  return (
    <AuthContext.Provider value={{ user, session, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}