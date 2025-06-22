// src/app/dashboard/page.tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import RiderDashboardContent from '@/components/dashboard/RiderDashboardContent';
import ProviderDashboardContent from '@/components/dashboard/ProviderDashboardContent';

export default function DashboardIndex() {
  const { user } = useAuth();

  // We know by this point user is non-null and loading is false
  return user!.is_provider
    ? <ProviderDashboardContent />
    : <RiderDashboardContent />;
}
