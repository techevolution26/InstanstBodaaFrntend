// src/components/dashboard/RiderDashboardContent.tsx
'use client';

import Link from 'next/link';
import { useRides } from '../../hooks/useRides';

type Ride = {
  id: number;
  status: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_lat: number;
  dropoff_lng: number;
};

export default function RiderDashboardContent() {
  const { data, isLoading, isError } = useRides();

  if (isLoading) return <p>Loading your rides…</p>;
  if (isError) return <p>Error loading rides.</p>;

  // Ensure rides is always an array
  const rides: Ride[] = Array.isArray(data) ? data : [];

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Your Rides</h2>
      {rides.length === 0 ? (
        <div className="p-4 border rounded mb-2 text-gray-600">
          No pending rides. Want to <Link href="/dashboard/request" className="text-blue-600 hover:underline">create your first ride</Link>?
        </div>
      ) : (
        <ul>
          {rides.map((ride: Ride) => (
            <li key={ride.id} className="p-4 border rounded mb-2">
              <p>
                <strong>Ride #{ride.id}</strong> —{' '}
                <span className="capitalize">
                  {ride.status.replace('_', ' ')}
                </span>
              </p>
              <p>
                From ({ride.pickup_lat.toFixed(3)}, {ride.pickup_lng.toFixed(3)}) → (
                {ride.dropoff_lat.toFixed(3)}, {ride.dropoff_lng.toFixed(3)})
              </p>
              <Link
                href={`/dashboard/rides/${ride.id}`}
                className="text-blue-600 hover:underline"
              >
                View Details →
              </Link>
            </li>
          ))}
        </ul>
      )}
      {/* pagination controls, if you  */}
    </div>
  );
}
