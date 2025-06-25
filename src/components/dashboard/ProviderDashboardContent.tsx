'use client';

import { useState } from 'react';
import GoOnlineToggle from '@/components/GoOnlineToggle';
import JobCard from '@/components/JobCard';
import { useProviderJobs } from '@/hooks/useProviderJobs';

const filters = ['Incoming', 'Assigned', 'Completed'] as const;
type Filter = (typeof filters)[number];

type ProviderJob = {
  id: number;
  pickup_lat?: number;
  pickup_lng?: number;
  pickupLat?: number;
  pickupLng?: number;
  dropoff_lat?: number;
  dropoff_lng?: number;
  dropoffLat?: number;
  dropoffLng?: number;
  created_at?: string;
  createdAt?: string;
  status: 'pending' | 'assigned' | 'completed';
  type?: 'ride' | 'delivery';
};

type Job = {
  id: number;
  pickup_lat?: number;
  pickup_lng?: number;
  dropoff_lat?: number;
  dropoff_lng?: number;
  created_at?: string;
  status: 'pending' | 'assigned' | 'completed';
  type?: 'ride' | 'delivery';
};

// Map filter to job status
const filterToStatus: Record<Filter, 'incoming' | 'assigned' | 'completed'> = {
  Incoming: 'incoming',
  Assigned: 'assigned',
  Completed: 'completed',
};

export default function ProviderDashboardContent() {
  const [filter, setFilter] = useState<Filter>('Incoming');

  const { data, isLoading, isError } = useProviderJobs(
    filterToStatus[filter]
  );

  // Normalize jobs to a consistent shape
  const jobs: Job[] = ((data ?? []) as unknown as ProviderJob[]).map((job) => ({
    id: typeof job.id === 'string' ? Number(job.id) : job.id,
    pickup_lat: job.pickup_lat ?? job.pickupLat,
    pickup_lng: job.pickup_lng ?? job.pickupLng,
    dropoff_lat: job.dropoff_lat ?? job.dropoffLat,
    dropoff_lng: job.dropoff_lng ?? job.dropoffLng,
    created_at: job.created_at ?? job.createdAt,
    status: job.status,
    type: job.type,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl font-bold text-zinc-800">Provider Dashboard</h1>
        <GoOnlineToggle />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-sm rounded border ${f === filter
                ? 'bg-zinc-800 text-white border-zinc-800'
                : 'bg-white text-zinc-600 border-zinc-300 hover:bg-zinc-100'
                }`}
            >
              {f}
            </button>
          ))}
        </div>

        {jobs.length > 0 && filter === 'Incoming' && (
          <span className="text-sm font-medium bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
            {jobs.length} new
          </span>
        )}
      </div>

      {isLoading && <p className="text-sm text-zinc-500">Loading {filter.toLowerCase()} jobs…</p>}
      {isError && <p className="text-sm text-red-600">Failed to load jobs.</p>}

      {jobs.length === 0 && !isLoading ? (
        <div className="text-center py-12 text-zinc-500 border rounded bg-zinc-50">
          <p className="text-lg font-medium">
            {filter === 'Incoming'
              ? 'No available jobs in your area yet.'
              : `No ${filter.toLowerCase()} jobs.`}
          </p>
          {filter === 'Incoming' && <p className="text-sm mt-2">Keep your status online to be notified.</p>}
        </div>
      ) : (
        <ul className="grid gap-4">
          {jobs.map((job) => (
            <li key={job.id}>
              <JobCard
                {...job}
                pickup_lat={job.pickup_lat ?? 0}
                pickup_lng={job.pickup_lng ?? 0}
                dropoff_lat={job.dropoff_lat ?? 0}
                dropoff_lng={job.dropoff_lng ?? 0}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
