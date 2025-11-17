'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(form);
      toast.success('Logged in successfully!');
    } catch (err: unknown) {
      type ErrorResponse = {
        response?: {
          data?: {
            message?: string;
          };
        };
      };
      let msg = 'Login failed. Please check credentials.';
      if (
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        typeof (err as ErrorResponse).response === 'object' &&
        (err as ErrorResponse).response !== undefined &&
        'data' in (err as ErrorResponse).response! &&
        typeof (err as ErrorResponse).response!.data === 'object' &&
        (err as ErrorResponse).response!.data !== undefined &&
        'message' in (err as ErrorResponse).response!.data! &&
        typeof (err as ErrorResponse).response!.data!.message === 'string'
      ) {
        msg = (err as ErrorResponse).response!.data!.message as string;
      }
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg flex overflow-hidden">
        {/* Brand panel (hidden on small screens) */}
        <div className="hidden md:flex md:w-1/2 bg-indigo-600/5 items-center justify-center p-8">
          <div className="text-center">
            <div className="mx-auto mb-4 w-28 h-28">
              <Image
                src="/instantBodaa.png"
                alt="InstantBodaa logo"
                width={112}
                height={112}
                className="object-contain"
              />
            </div>
            <h2 className="text-xl font-bold text-slate-800">InstantBodaa</h2>
            <p className="text-sm text-slate-500 mt-1">Taxi & Deliveries — fast & reliable</p>
          </div>
        </div>

        {/* Form panel */}
        <div className="w-full md:w-1/2 p-8">
          {/* Small-screen logo above the heading */}
          <div className="flex justify-center md:hidden mb-4">
            <div className="w-20 h-20">
              <Image
                src="/instantBodaa.png"
                alt="InstantBodaa logo"
                width={80}
                height={80}
                className="object-contain"
              />
            </div>
          </div>

          <h1 className="text-2xl md:text-3xl font-semibold text-center text-slate-800 mb-4">Welcome back</h1>

          {error && (
            <p role="alert" className="text-sm text-red-600 mb-4">
              {error}
            </p>
          )}

          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <label className="block">
              <span className="sr-only">Email</span>
              <input
                required
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
                aria-label="Email"
              />
            </label>

            <label className="block">
              <span className="sr-only">Password</span>
              <input
                required
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
                aria-label="Password"
              />
            </label>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-slate-600">Remember me</span>
              </label>

              <a href="/auth/forgot" className="text-indigo-600 hover:underline">
                Forgot?
              </a>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-3 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition disabled:opacity-60"
            >
              {isSubmitting && (
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" aria-hidden>
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              )}
              <span className="font-semibold">{isSubmitting ? 'Signing in...' : 'Sign In'}</span>
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-slate-600">
            Don’t have an account?{' '}
            <a href="/auth/register" className="text-indigo-600 font-medium hover:underline">
              Register
            </a>
          </p>
        </div>
      </div>
    </div>
  );


}
