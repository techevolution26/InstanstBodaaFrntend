// src/components/dashboard/ProviderDashboardContent.tsx
'use client';

import Link from 'next/link';
import { useIncomingJobs } from '../../hooks/useIncomingJobs';
import GoOnlineToggle from '@/components/GoOnlineToggle';

type Ride = {
  id: number;
  pickup_lat: number;
  pickup_lng: number;
  // will add other fields as needed
};

export default function ProviderDashboardContent() {
  const { data, isLoading, isError } = useIncomingJobs();

  if (isLoading) return <p>Loading incoming jobs…</p>;
  if (isError) return <p>Error loading jobs.</p>;

  const jobs: Ride[] = data ?? [];

  return (
    <div>
      <GoOnlineToggle />
      <ul>
        {jobs.map((ride: Ride) => (
          <li key={ride.id} className="p-4 border rounded">
            <p>
              <strong>Ride #{ride.id}</strong> — pickup at ({ride.pickup_lat.toFixed(3)}, {ride.pickup_lng.toFixed(3)})
            </p>
            <Link
              href={`/dashboard/requests/${ride.id}`}
              className="text-blue-600 hover:underline"
            >
              View & Accept →
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
