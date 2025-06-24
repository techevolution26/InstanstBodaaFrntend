'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
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
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md bg-white p-8 shadow-xl rounded-2xl">
        <h1 className="text-3xl font-bold mb-6 text-center text-indigo-700">Welcome Back</h1>
        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            required
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
          />
          <input
            required
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            {isSubmitting ? 'Logging in...' : 'Log In'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm">
          Don’t have an account? <a href="/auth/register" className="text-indigo-600 underline">Register</a>
        </p>
      </div>
    </div>
  );
}
