// src/components/GroupedRideList.tsx
'use client';

// import { CalendarDaysIcon } from '@heroicons/react/24/outline';
// import Link from 'next/link';
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

type Props = {
  rides: Ride[];
};

export default function GroupedRideList({ rides }: Props) {
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
    <>
      {Object.entries(grouped).map(([group, items]) => {
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
              {rides.map((ride) => (
                <RideCard key={ride.id} ride={ride} />
              ))}
            </ul>
          </div>
        ));
      })}
    </>
  );
}
