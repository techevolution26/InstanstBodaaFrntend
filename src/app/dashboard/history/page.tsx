'use client';

import { useRequests } from '@/hooks/useRequests';
import Link from 'next/link';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';

interface Ride {
  id: number;
  status: string;
  pickup_lat: number | string;
  pickup_lng: number | string;
  dropoff_lat: number | string;
  dropoff_lng: number | string;
  created_at: string;
}

type HistoryRideItemProps = {
  ride: Ride;
};

function HistoryRideItem({ ride }: HistoryRideItemProps) {
  // coerce & format
  const fmt = (c: number | string) => Number(c).toFixed(3);

  // init to coords
  const [pickupAddr, setPickupAddr] = useState<string>(
    `(${fmt(ride.pickup_lat)}, ${fmt(ride.pickup_lng)})`
  );
  const [dropoffAddr, setDropoffAddr] = useState<string>(
    `(${fmt(ride.dropoff_lat)}, ${fmt(ride.dropoff_lng)})`
  );

  // fetch helper
  const fetchAddress = async (
    lat: number | string,
    lon: number | string,
    setter: (s: string) => void
  ) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/reverse-geocode?lat=${lat}&lon=${lon}`
      );
      const data = await res.json();
      if (res.ok && data.display_name) {
        setter(data.display_name);
      }
    } catch {
      // keep the coord fallback
    }
  };

  // on mount (or if coords change)…
  useEffect(() => {
    fetchAddress(ride.pickup_lat, ride.pickup_lng, setPickupAddr);
    fetchAddress(ride.dropoff_lat, ride.dropoff_lng, setDropoffAddr);
  }, [ride.pickup_lat, ride.pickup_lng, ride.dropoff_lat, ride.dropoff_lng]);

  // date formatting
  const date = new Date(ride.created_at);
  const dateStr = date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const timeStr = date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <li className="p-4 border border-zinc-200 rounded-lg shadow-sm bg-white hover:shadow-md transition">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-zinc-600">
          Ride <span className="font-semibold">#{ride.id}</span>
        </p>
        <span
          className={`text-xs px-2 py-1 rounded-full font-medium ${
            ride.status === 'completed'
              ? 'bg-green-100 text-green-700'
              : ride.status === 'cancelled'
              ? 'bg-red-100 text-red-700'
              : 'bg-zinc-100 text-zinc-700'
          }`}
        >
          {ride.status.replace('_', ' ')}
        </span>
      </div>

      {/* Date */}
      <div className="flex items-center text-xs text-zinc-500 mb-3 gap-2">
        <CalendarDaysIcon className="w-4 h-4" />
        <span>
          {dateStr} at {timeStr}
        </span>
      </div>

      {/* Pickup / Dropoff */}
      <div className="text-sm text-zinc-700 mb-3 space-y-1">
        <p>
          <strong>Pickup:</strong>{' '}
          <span className="truncate block" title={pickupAddr}>
            {pickupAddr}
          </span>
        </p>
        <p>
          <strong>Dropoff:</strong>{' '}
          <span className="truncate block" title={dropoffAddr}>
            {dropoffAddr}
          </span>
        </p>
      </div>

      <Link
        href={`/dashboard/history/${ride.id}`}
        className="inline-block text-sm font-medium text-indigo-600 hover:underline transition"
      >
        View Details →
      </Link>
    </li>
  );
}

export default function RiderHistoryPage() {
  const { data, isLoading, isError } = useRequests();

  if (isLoading)
    return <p className="text-sm text-zinc-500">Loading your ride history…</p>;
  if (isError)
    return <p className="text-sm text-red-500">Failed to load ride history.</p>;

  const rides: Ride[] = data?.data || [];

  // group into buckets
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const isSameDay = (a: Date, b: Date) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  const grouped: Record<string, Ride[]> = {
    Today: [],
    Yesterday: [],
    'Last 7 Days': [],
    Older: [],
  };

  rides.forEach((ride) => {
    const rideDate = new Date(ride.created_at);
    const diffDays =
      (today.getTime() - rideDate.getTime()) / (1000 * 60 * 60 * 24);

    if (isSameDay(rideDate, today)) grouped.Today.push(ride);
    else if (isSameDay(rideDate, yesterday)) grouped.Yesterday.push(ride);
    else if (diffDays <= 7) grouped['Last 7 Days'].push(ride);
    else grouped.Older.push(ride);
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-zinc-800">Your Ride History</h1>
      {rides.length === 0 ? (
        <div className="p-6 text-center text-zinc-500 border rounded bg-zinc-50">
          You haven’t taken any rides yet.
        </div>
      ) : (
        Object.entries(grouped).map(([group, items]) => {
          if (items.length === 0) return null;

          // for “Older,” further group by year
          const buckets =
            group === 'Older'
              ? Object.entries(
                  items.reduce((acc, ride) => {
                    const yr = new Date(ride.created_at)
                      .getFullYear()
                      .toString();
                    acc[yr] = acc[yr] || [];
                    acc[yr].push(ride);
                    return acc;
                  }, {} as Record<string, Ride[]>)
                )
              : [[group, items]] as [string, Ride[]][];

          return buckets.map(([label, rides]) => (
            <div key={group + label} className="space-y-3">
              <h2 className="text-lg font-semibold text-zinc-700 sticky top-0 z-10 bg-white py-2 border-b border-zinc-100">
                {label}
              </h2>
              <ul className="space-y-4">
                {rides.map((ride) => (
                  <HistoryRideItem key={ride.id} ride={ride} />
                ))}
              </ul>
            </div>
          ));
        })
      )}
    </div>
  );
}
