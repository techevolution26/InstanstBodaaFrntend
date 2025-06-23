// src/app/auth/register/page.tsx
'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', password_confirmation: '', is_provider: false });
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await register(form);
    } catch (err: unknown) {
      type ErrorResponse = {
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
        (err as ErrorResponse).response?.data?.message
      ) {
        setError((err as ErrorResponse).response!.data!.message!);
      } else {
        setError('Registration failed');
      }
    }
  }

  return (
    <div className="max-w-md mx-auto mt-16 p-6 border rounded">
      <h1 className="text-2xl mb-4">Create Account</h1>
      {error && <p className="text-red-600">{error}</p>}
      <form onSubmit={onSubmit} className="space-y-4">
        <input required placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full" />
        <input required type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full" />
        <input required placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full" />
        <div className="flex items-center space-x-2">
          <input type="checkbox" checked={form.is_provider} onChange={e => setForm({ ...form, is_provider: e.target.checked })} />
          <label>I am a service provider</label>
        </div>
        <input required type="password" placeholder="Password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full" />
        <input required type="password" placeholder="Confirm Password" value={form.password_confirmation} onChange={e => setForm({ ...form, password_confirmation: e.target.value })} className="w-full" />
        <button type="submit" className="w-full py-2 bg-blue-600 text-white">Register</button>
      </form>
      <p className="mt-4 text-center">
        Already have an account? <a href="/auth/login" className="text-blue-600">Log in</a>
      </p>
    </div>
  );
}
