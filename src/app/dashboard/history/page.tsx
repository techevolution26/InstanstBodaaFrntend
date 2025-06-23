// src/app/dashboard/history/page.tsx
'use client';

import { useRequests } from '@/hooks/useRequests'; // Adjust the path based on your project structure
import Link from 'next/link';

interface Ride {
  id: number;
  status: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_lat: number;
  dropoff_lng: number;
}

export default function RiderHistoryPage() {
  const { data, isLoading, isError } = useRequests();

  if (isLoading) return <p>Loading your history…</p>;
  if (isError) return <p>Failed to load history.</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Your Ride History</h1>
      <ul className="space-y-4">
        {data?.data?.map((ride: Ride) => (
          <li key={ride.id} className="p-4 border rounded">
            <p>
              <strong>#{ride.id}</strong> —{' '}
              <span className="capitalize">{ride.status.replace('_',' ')}</span>
            </p>
            <p>
              From ({ride.pickup_lat.toFixed(3)}, {ride.pickup_lng.toFixed(3)}) → (
              {ride.dropoff_lat.toFixed(3)}, {ride.dropoff_lng.toFixed(3)})
            </p>
            <Link
              href={`/dashboard/history/${ride.id}`}
              className="text-blue-600 hover:underline"
            >
              View Details
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
