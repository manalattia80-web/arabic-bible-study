'use client';
/**
 * lib/auth-context.tsx
 * React context for admin authentication state.
 * Stores JWT in localStorage and exposes login/logout/user.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi, AdminUser } from './api';

interface AuthContextValue {
  user:    AdminUser | null;
  token:   string | null;
  loading: boolean;
  login:   (email: string, password: string) => Promise<void>;
  logout:  () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,    setUser]    = useState<AdminUser | null>(null);
  const [token,   setToken]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount: restore session from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('admin_token');
    if (saved) {
      setToken(saved);
      authApi.me()
        .then(res => setUser(res.data))
        .catch(() => { localStorage.removeItem('admin_token'); setToken(null); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    localStorage.setItem('admin_token', res.token);
    setToken(res.token);
    setUser(res.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('admin_token');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
