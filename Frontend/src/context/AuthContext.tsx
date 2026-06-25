/**
 * @file AuthContext.tsx
 * @description Global React Context provider for user session management.
 * 
 * BUSINESS CONTEXT:
 * Coordinates state for the currently authenticated profile, tracks loading states during boot,
 * and handles secure session recovery:
 * 1. Checks for local JWT storage (`los_token`).
 * 2. Fetches user identity details from `/auth/me` on boot to verify token validity.
 * 3. Handles login actions, storing active JWTs in local storage.
 * 4. Cleans tokens and states on logout actions.
 */

'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../services/api';

export type UserRole = 'SUPER_ADMIN' | 'LOAN_OFFICER' | 'CREDIT_ANALYST' | 'APPROVER';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadUser() {
      const storedToken = localStorage.getItem('los_token');
      if (storedToken) {
        try {
          setToken(storedToken);
          const response = await api.get('/auth/me');
          if (response.success && response.data?.user) {
            setUser(response.data.user);
          } else {
            // Token is invalid/expired
            localStorage.removeItem('los_token');
            setUser(null);
            setToken(null);
          }
        } catch (e) {
          console.error('Session restore failed:', e);
          localStorage.removeItem('los_token');
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.success && response.data) {
      const { token: userToken, user: userProfile } = response.data;
      localStorage.setItem('los_token', userToken);
      setToken(userToken);
      setUser(userProfile);
      router.push('/dashboard');
    }
  };

  const logout = () => {
    localStorage.removeItem('los_token');
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, token, login, logout }}>
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
export default AuthContext;
