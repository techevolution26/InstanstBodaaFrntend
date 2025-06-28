'use client';

import Link from 'next/link';
import { useRides } from '@/hooks/useRides';
import { useState } from 'react';
import GroupedRideList from '@/components/GroupedRideList';
import RideCard from '@/components/RideCard';

type Ride = {
  id: number;
  status: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_lat: number;
  dropoff_lng: number;
  created_at: string;
};

const filters = ['Active', 'Completed', 'All'] as const;
type Filter = (typeof filters)[number];

export default function RiderDashboardContent() {
  const [filter, setFilter] = useState<Filter>('Active');
  const { data, isLoading, isError } = useRides(filter.toLowerCase() as 'active' | 'completed' | 'all');

  if (isLoading)
    return <p className="text-sm text-zinc-500">Loading your rides…</p>;

  if (isError)
    return <p className="text-sm text-red-500">Error loading rides.</p>;

  const rides: Ride[] = Array.isArray(data) ? data : [];

  const filtered = rides.filter((ride) => {
    if (filter === 'All') return true;
    if (filter === 'Active') return ride.status !== 'completed' && ride.status !== 'cancelled';
    if (filter === 'Completed') return ride.status === 'completed';
    return true;
  });

  // Haversine formula to calculate distance between two lat/lng points in kilometers
  function getDistanceInKm(
    pickup_lat: number,
    pickup_lng: number,
    dropoff_lat: number,
    dropoff_lng: number
  ) {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371; // Earth's radius in km
    const dLat = toRad(dropoff_lat - pickup_lat);
    const dLng = toRad(dropoff_lng - pickup_lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(pickup_lat)) *
      Math.cos(toRad(dropoff_lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  return (
  <div className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <h2 className="text-xl font-bold text-zinc-800">Your Rides</h2>
      <div className="flex gap-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 text-sm rounded border ${
              filter === f
                ? 'bg-zinc-800 text-white border-zinc-800'
                : 'bg-white text-zinc-600 border-zinc-300 hover:bg-zinc-100'
            }`}
          >
            {f}
          </button>
        ))}
      </div>
    </div>

    {filtered.length === 0 ? (
      <div className="p-6 border border-zinc-200 rounded bg-zinc-50 text-zinc-600 text-center">
        {filter === 'Completed' ? (
          <p>No mileage covered yet.</p>
        ) : (
          <>
            <p className="mb-2">No rides found.</p>
            <Link
              href="/dashboard/request"
              className="inline-block text-sm font-medium text-indigo-600 hover:underline"
            >
              Create your first ride →
            </Link>
          </>
        )}
      </div>
    ) : filter === 'All' ? (
      <GroupedRideList rides={filtered} />
    ) : (
      <>
        {filter === 'Completed' && filtered.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-zinc-700 mb-2">
            <span className="text-lg">🛣️</span>
            <span className="font-medium">
              Total Mileage:{' '}
              {filtered
                .reduce(
                  (sum, ride) =>
                    sum +
                    getDistanceInKm(
                      ride.pickup_lat,
                      ride.pickup_lng,
                      ride.dropoff_lat,
                      ride.dropoff_lng
                    ),
                  0
                )
                .toFixed(2)}{' '}
              km
            </span>
          </div>
        )}

        {filter === 'Active' ? (
          Object.entries(
            filtered.reduce((acc, ride) => {
              acc[ride.status] = acc[ride.status] || [];
              acc[ride.status].push(ride);
              return acc;
            }, {} as Record<string, Ride[]>)
          ).map(([status, rides]) => (
            <div key={status} className="space-y-3">
              <h3 className="text-sm font-semibold text-zinc-600 uppercase tracking-wide">
                Status: {status.replace('_', ' ')}
              </h3>
              {/* ← grid replaces your old <ul> */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {rides.map((ride) => (
                  <RideCard key={ride.id} ride={ride} />
                ))}
              </div>
            </div>
          ))
        ) : (
          /* ← grid replaces your old <ul> */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((ride) => (
              <RideCard key={ride.id} ride={ride} />
            ))}
          </div>
        )}
      </>
    )}
  </div>
);
}
