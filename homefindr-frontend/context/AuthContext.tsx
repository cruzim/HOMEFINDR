'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { auth, setTokens, clearTokens, type User } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (body: { full_name: string; email: string; phone?: string; password: string; role: string }) => Promise<void>;
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

  const login = async (email: string, password: string) => {
    const tokens = await auth.login(email, password);
    setTokens(tokens.access_token, tokens.refresh_token);
    const me = await auth.me();
    setUser(me);
  };

  const register = async (body: { full_name: string; email: string; phone?: string; password: string; role: string }) => {
    await auth.register(body);
    const tokens = await auth.login(body.email, body.password);
    setTokens(tokens.access_token, tokens.refresh_token);
    const me = await auth.me();
    setUser(me);
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
