// src/app/auth/login/page.tsx
'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await login(form);
    } catch (err: unknown) {
      type ErrorWithResponse = {
        response?: {
          data?: {
            message?: string;
          };
        };
      };
      if (
        err &&
        typeof err === 'object' &&
        'response' in err &&
        (err as ErrorWithResponse).response?.data?.message
      ) {
        setError((err as ErrorWithResponse).response!.data!.message!);
      } else {
        setError('Login failed');
      }
    }
  }

  return (
    <div className="max-w-md mx-auto mt-16 p-6 border rounded">
      <h1 className="text-2xl mb-4">Log In</h1>
      {error && <p className="text-red-600">{error}</p>}
      <form onSubmit={onSubmit} className="space-y-4">
        <input required type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full" />
        <input required type="password" placeholder="Password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full" />
        <button type="submit" className="w-full py-2 bg-green-600 text-white">Log In</button>
      </form>
      <p className="mt-4 text-center">
        Don’t have an account? <a href="/auth/register" className="text-green-600">Register</a>
      </p>
    </div>
  );
}
