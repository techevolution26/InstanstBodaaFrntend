'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
    is_provider: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await register(form);
      toast.success('Registered successfully!');
    } catch (err: unknown) {
      let msg = 'Registration failed. Please try again.';
      if (err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'message' in err.response.data) {
        msg = (err.response.data as { message?: string }).message || msg;
      }
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Brand / info panel (hidden on small screens) */}
        <div className="hidden md:flex md:flex-col items-center justify-center gap-4 bg-indigo-600/5 p-8">
          <div className="mx-auto mb-3 w-28 h-28">
            <Image
              src="/instantBodaa.png"
              alt="InstantBodaa logo"
              width={112}
              height={112}
              className="object-contain"
            />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800">InstantBodaa</h2>
          <p className="text-sm text-slate-500 text-center">
            Create an account to request motorcycle taxi rides and fast deliveries — trusted, insured, on-demand.
          </p>
        </div>

        {/* Form panel */}
        <div className="p-8 md:p-10">
          {/* compact header for mobile */}
          <div className="flex items-center md:hidden mb-6 gap-3">
            <div className="w-14 h-14">
              <Image src="/instantBodaa.png" alt="InstantBodaa" width={56} height={56} className="object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Create an Account</h1>
              <p className="text-sm text-slate-500">Sign up to start using InstantBodaa</p>
            </div>
          </div>

          {/* desktop header (hidden on mobile above) */}
          <h1 className="hidden md:block text-3xl font-bold mb-6 text-center text-slate-800">Create an Account</h1>

          {error && (
            <p role="alert" className="text-sm text-red-600 mb-4">
              {error}
            </p>
          )}

          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <label className="block">
              <span className="sr-only">Name</span>
              <input
                required
                placeholder="Full name"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
                aria-label="Full name"
              />
            </label>

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
              <span className="sr-only">Phone</span>
              <input
                required
                type="tel"
                placeholder="Phone (+254700000000)"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
                aria-label="Phone"
              />
            </label>

            <div className="flex items-center space-x-3">
              <input
                id="is_provider"
                type="checkbox"
                checked={form.is_provider}
                onChange={e => setForm({ ...form, is_provider: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="is_provider" className="text-sm text-slate-700">
                I am a service provider
              </label>
            </div>

            <label className="block">
              <span className="sr-only">Password</span>
              <input
                required
                type="password"
                placeholder="Password (min 8 characters)"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
                aria-label="Password"
              />
            </label>

            <label className="block">
              <span className="sr-only">Confirm Password</span>
              <input
                required
                type="password"
                placeholder="Confirm password"
                value={form.password_confirmation}
                onChange={e => setForm({ ...form, password_confirmation: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
                aria-label="Confirm password"
              />
            </label>

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
              <span className="font-semibold">{isSubmitting ? 'Registering...' : 'Create account'}</span>
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <a href="/auth/login" className="text-indigo-600 font-medium hover:underline">
              Log in
            </a>
          </p>
        </div>
      </div>
    </div>
  );

}
