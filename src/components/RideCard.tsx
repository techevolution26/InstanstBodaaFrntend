'use client';

import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type Ride = {
  id: number;
  status: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_lat: number;
  dropoff_lng: number;
  created_at: string;
};

type RideCardProps = {
  ride: Ride;
  href?: string;
};

export default function RideCard({
  ride,
  href = `/dashboard/history/${ride.id}`,
}: RideCardProps) {
  const [pickupAddr, setPickupAddr] = useState<string>(
    `(${Number(ride.pickup_lat).toFixed(3)}, ${Number(ride.pickup_lng).toFixed(3)})`);
  const [dropoffAddr, setDropoffAddr] = useState<string>(
    `(${Number(ride.dropoff_lat).toFixed(3)}, ${Number(ride.dropoff_lng).toFixed(3)})`);

  // format date/time once
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

  // helper to fetch & set address
  const fetchAddress = async (
    lat: number,
    lon: number,
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
      // keep the coord fallback already in state
    }
  };

  // on mount, fetch both addresses
  useEffect(() => {
    fetchAddress(ride.pickup_lat, ride.pickup_lng, setPickupAddr);
    fetchAddress(ride.dropoff_lat, ride.dropoff_lng, setDropoffAddr);
  }, [ride.pickup_lat, ride.pickup_lng, ride.dropoff_lat, ride.dropoff_lng]);

  return (
    <li className="p-4 border border-zinc-200 rounded-lg bg-white shadow-sm hover:shadow-md transition">
      {/* Header: ID + Status */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-zinc-700">
          Ride <span className="font-semibold">#{ride.id}</span>
        </p>
        <span
          className={
            `text-xs px-2 py-1 rounded-full font-medium ` +
            (ride.status === 'completed'
              ? 'bg-green-100 text-green-700'
              : ride.status === 'cancelled'
                ? 'bg-red-100 text-red-700'
                : ride.status === 'pending'
                  ? 'bg-yellow-100 text-yellow-700'
                  : ride.status === 'assigned'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-zinc-100 text-zinc-700')
          }
        >
          {ride.status.replace('_', ' ')}
        </span>
      </div>

      {/* Date/Time */}
      <div className="flex items-center text-xs text-zinc-500 gap-2 mb-2">
        <CalendarDaysIcon className="w-4 h-4" />
        <span>
          {dateStr} at {timeStr}
        </span>
      </div>

      {/* From / To with fetched addresses */}
      <div className="text-sm text-zinc-600 mb-3 space-y-1">
        <p>
          <strong>From:</strong>{' '}
          <span className="truncate block" title={pickupAddr}>
            {pickupAddr}
          </span>
        </p>
        <p>
          <strong>To:</strong>{' '}
          <span className="truncate block" title={dropoffAddr}>
            {dropoffAddr}
          </span>
        </p>
      </div>

      {/* Link */}
      <Link href={href} className="text-sm font-medium text-indigo-600 hover:underline">
        View Details →
      </Link>
    </li>
  );
}
