'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { auth, setTokens, clearTokens, type User } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (body: { full_name: string; email: string; phone?: string; password: string; role: string }) => Promise<User>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('hf_access_token') : null;
    if (!token) { setLoading(false); return; }
    try {
      const me = await auth.me();
      setUser(me);
    } catch {
      clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Returns the user object so callers can redirect based on role
  const login = async (email: string, password: string): Promise<User> => {
    const tokens = await auth.login(email, password);
    setTokens(tokens.access_token, tokens.refresh_token);
    const me = await auth.me();
    setUser(me);
    return me;
  };

  // Returns the user object so callers can redirect based on role
  const register = async (body: { full_name: string; email: string; phone?: string; password: string; role: string }): Promise<User> => {
    await auth.register(body);
    const tokens = await auth.login(body.email, body.password);
    setTokens(tokens.access_token, tokens.refresh_token);
    const me = await auth.me();
    setUser(me);
    return me;
  };

  const logout = () => {
    clearTokens();
    setUser(null);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

/** Returns the correct dashboard path for a given role */
export function dashboardFor(role: User['role']): string {
  if (role === 'agent') return '/dashboard/agent';
  if (role === 'admin') return '/dashboard/admin';
  return '/dashboard/buyer';
}