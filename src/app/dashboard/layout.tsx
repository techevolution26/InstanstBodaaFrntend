'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [loading, user])

  if (loading || !user) {
    return <p>Loading...</p>
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 bg-gray-100 p-4">
        <h2 className="text-xl mb-4">Hello, {user.name}</h2>
        <nav className="space-y-2">
          {!user.is_provider ? (
            <>
              <a href="/dashboard" className="block">My Rides</a>
              <a href="/dashboard/deliveries" className="block">My Deliveries</a>
            </>
          ) : (
            <>
              <a href="/dashboard/requests" className="block">Incoming Jobs</a>
              <a href="/dashboard/earnings" className="block">Earnings</a>
            </>
          )}
          <a href="/dashboard/profile" className="block">Profile</a>
          <button onClick={logout} className="mt-4 text-red-600">Log out</button>
        </nav>
      </aside>
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  );
}
