// src/app/dashboard/layout.tsx
'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  // redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <div className="p-8">Loading…</div>;
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 bg-gray-100 p-4">
        <h2 className="text-xl mb-4">Hello, {user.name}</h2>
        <nav className="space-y-2">
          {user.is_provider ? (
            <>
              <a href="/dashboard" className="block">Incoming Jobs</a>
              <a href="/dashboard/earnings" className="block">Earnings</a>
            </>
          ) : (
            <>
              <a href="/dashboard/history" className="block">My Rides</a>
              <a href="/dashboard/request" className="block">Request Ride</a>
            </>
          )}
          <a href="/dashboard/profile" className="block">Profile</a>
          <button onClick={logout} className="mt-4 text-red-600">
            Log out
          </button>
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
