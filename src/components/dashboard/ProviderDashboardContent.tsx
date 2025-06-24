//src/component/ProviderDashboardContent.tsx
'use client';
import { useIncomingJobs } from '@/hooks/useIncomingJobs';
import GoOnlineToggle from '@/components/GoOnlineToggle';
import JobCard from '@/components/JobCard';

type Ride = {
  id: number;
  pickup_lat: number;
  pickup_lng: number;
  created_at?: string;
};

export default function ProviderDashboardContent() {
  const { data, isLoading, isError } = useIncomingJobs();
  const jobs: Ride[] = data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl font-bold text-zinc-800">Provider Dashboard</h1>
        <GoOnlineToggle />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-700">Incoming Requests</h2>
        {jobs.length > 0 && (
          <span className="text-sm font-medium bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
            {jobs.length} new
          </span>
        )}
      </div>

      {isLoading && <p className="text-sm text-zinc-500">Loading incoming jobs…</p>}
      {isError && <p className="text-sm text-red-600">Failed to load jobs.</p>}

      {jobs.length === 0 && !isLoading ? (
        <div className="text-center py-12 text-zinc-500 border rounded bg-zinc-50">
          <p className="text-lg font-medium">No available jobs in your area yet.</p>
          <p className="text-sm mt-2">Keep your status online to be notified.</p>
        </div>
      ) : (
        <ul className="grid gap-4">
          {jobs.map((ride) => (
            <li key={ride.id}>
              <JobCard {...ride} type="ride" /> </li>
          ))}
        </ul>
      )}
    </div>
  );
}
