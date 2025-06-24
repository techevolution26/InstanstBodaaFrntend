'use client';

import { useRequests } from '@/hooks/useRequests';
import Link from 'next/link';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';

interface Ride {
  id: number;
  status: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_lat: number;
  dropoff_lng: number;
  created_at: string;
}

export default function RiderHistoryPage() {
  const { data, isLoading, isError } = useRequests();

  if (isLoading)
    return <p className="text-sm text-zinc-500">Loading your ride history…</p>;

  if (isError)
    return <p className="text-sm text-red-500">Failed to load ride history.</p>;

  const rides: Ride[] = data?.data || [];

  const grouped: Record<string, Ride[]> = {
    Today: [],
    Yesterday: [],
    'Last 7 Days': [],
    Older: [],
  };

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a: Date, b: Date) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  rides.forEach((ride) => {
    const rideDate = new Date(ride.created_at);
    const diffMs = today.getTime() - rideDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (isSameDay(rideDate, today)) {
      grouped.Today.push(ride);
    } else if (isSameDay(rideDate, yesterday)) {
      grouped.Yesterday.push(ride);
    } else if (diffDays <= 7) {
      grouped['Last 7 Days'].push(ride);
    } else {
      grouped.Older.push(ride);
    }
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

          const groupedByYear: Record<string, Ride[]> =
            group === 'Older'
              ? items.reduce((acc, ride) => {
                  const year = new Date(ride.created_at).getFullYear().toString();
                  acc[year] = acc[year] || [];
                  acc[year].push(ride);
                  return acc;
                }, {} as Record<string, Ride[]>)
              : { [group]: items };

          return Object.entries(groupedByYear).map(([label, rides]) => (
            <div key={group + label} className="space-y-3">
              <h2 className="text-lg font-semibold text-zinc-700 sticky top-0 z-10 bg-white py-2 border-b border-zinc-100">
                {label}
              </h2>
              <ul className="space-y-4">
                {rides.map((ride) => {
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
                    <li
                      key={ride.id}
                      className="p-4 border border-zinc-200 rounded-lg shadow-sm bg-white hover:shadow-md transition"
                    >
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

                      <div className="flex items-center text-xs text-zinc-500 mb-3 gap-2">
                        <CalendarDaysIcon className="w-4 h-4" />
                        <span>
                          {dateStr} at {timeStr}
                        </span>
                      </div>

                      <div className="text-sm text-zinc-700 mb-3">
                        <p>
                          <strong>Pickup:</strong> ({Number(ride.pickup_lat).toFixed(3)}, {Number(ride.pickup_lng).toFixed(3)})
                        </p>
                        <p>
                          <strong>Dropoff:</strong> ({Number(ride.dropoff_lat).toFixed(3)}, {Number(ride.dropoff_lng).toFixed(3)})
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
                })}
              </ul>
            </div>
          ));
        })
      )}
    </div>
  );
}
