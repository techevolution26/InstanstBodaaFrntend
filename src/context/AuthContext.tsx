'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api, { initCsrf } from '@/services/api';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  is_provider: boolean;
}
interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
  is_provider: boolean;
}
interface LoginData {
  email: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  register: (data: RegisterData) => Promise<void>;
  login: (data: LoginData) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);
export function AuthProvider({ children }: { children: ReactNode }): React.ReactElement {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // bootstrap: get CSRF + current user
  useEffect(() => {
    (async () => {
      await initCsrf();
      try {
        const { data } = await api.get('/api/me');
        setUser(data);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function register(form: RegisterData) {
    await initCsrf();
    const { data } = await api.post('/api/register', form);
    setUser(data.user);
    router.push('/dashboard');
  }

  async function login(form: LoginData) {
    await initCsrf();
    const { data } = await api.post('/api/login', form);
    setUser(data.user);
    router.push('/dashboard');
  }

  async function logout() {
    await api.post('/api/logout');
    setUser(null);
    router.push('/auth/login');
  }

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
