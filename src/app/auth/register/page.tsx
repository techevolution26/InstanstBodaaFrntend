'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
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
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md bg-white p-8 shadow-xl rounded-2xl">
        <h1 className="text-3xl font-bold mb-6 text-center text-blue-700">Create an Account</h1>
        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
        <form onSubmit={onSubmit} className="space-y-4">
          <input required placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
          <input required type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
          <input required placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
          <div className="flex items-center space-x-2">
            <input type="checkbox" checked={form.is_provider} onChange={e => setForm({ ...form, is_provider: e.target.checked })} />
            <label>I am a service provider</label>
          </div>
          <input required type="password" placeholder="Password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
          <input required type="password" placeholder="Confirm Password" value={form.password_confirmation} onChange={e => setForm({ ...form, password_confirmation: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          >
            {isSubmitting ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm">
          Already have an account? <a href="/auth/login" className="text-blue-600 underline">Log in</a>
        </p>
      </div>
    </div>
  );
}
