// src/app/dashboard/layout.tsx
'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import {
  BriefcaseIcon,
  CurrencyDollarIcon,
  ClockIcon,
  PlusCircleIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login');
    if (user) document.title = `${user.is_provider ? 'Provider' : 'Rider'} Dashboard`;
  }, [user, loading, router]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
  };

  if (loading || !user) return <div className="p-8 text-center">Loading dashboard…</div>;

  const navItems = user.is_provider
    ? [
        { href: '/dashboard', label: 'Incoming Jobs', icon: BriefcaseIcon },
        { href: '/dashboard/wallet', label: 'Wallet', icon: CurrencyDollarIcon },
      ]
    : [
        { href: '/dashboard/', label: 'My Rides', icon: ClockIcon },
        { href: '/dashboard/request', label: 'Request Ride', icon: PlusCircleIcon },
      ];

  const commonItems = [
    { href: '/dashboard/profile', label: 'Profile', icon: UserCircleIcon },
  ];

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-gray-50 p-6 border-r border-gray-200">
        <h2 className="text-xl font-semibold mb-6">Hi, {user.name}</h2>
        <nav className="space-y-2 text-sm">
          <p className="text-gray-500 uppercase text-xs tracking-wider mb-1">
            {user.is_provider ? 'Provider' : 'Rider'} Menu
          </p>
          {[...navItems, ...commonItems].map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              isActive={pathname === item.href}
            />
          ))}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-600 mt-4 hover:underline text-sm"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            Log out
          </button>
        </nav>
      </aside>
      <main className="flex-1 p-6 bg-white">{children}</main>
    </div>
  );
}

import { ComponentType, SVGProps } from 'react';

type NavLinkProps = {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  isActive: boolean;
};

function NavLink({ href, label, icon: Icon, isActive }: NavLinkProps) {
  return (
    <a
      href={href}
      className={`flex items-center gap-2 px-2 py-2 rounded transition ${
        isActive ? 'bg-indigo-100 font-semibold text-indigo-700' : 'hover:bg-gray-100'
      }`}
    >
      <Icon className="w-5 h-5" />
      {label}
    </a>
  );
}
