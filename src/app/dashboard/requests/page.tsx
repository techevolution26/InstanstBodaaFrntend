// src/app/dashboard/requests/page.tsx
'use client';

import { usePendingRequests } from '@/hooks/usePendingRequests';
import { useUpdateRequest } from '@/hooks/useUpdateRequest';
import Link from 'next/link';

interface Job {
  id: number;
  status: string;
  pickup_lat: number;
  pickup_lng: number;
}

export default function ProviderQueuePage() {
  const { data, isLoading, isError } = usePendingRequests();
  const update = useUpdateRequest();

  if (isLoading) return <p>Loading incoming jobs…</p>;
  if (isError) return <p>Failed to load jobs.</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Pending Requests</h1>
      <ul>
        {data.data.map((job: Job) => (
          <li key={job.id} className="p-4 border rounded flex justify-between items-center">
            <div>
              <p>
                <strong>#{job.id}</strong> —{' '}
                <span className="capitalize">{job.status}</span>
              </p>
              <p>
                From ({job.pickup_lat.toFixed(3)}, {job.pickup_lng.toFixed(3)})
              </p>
            </div>
            <div className="space-x-2">
              <button
                className="px-3 py-1 bg-blue-600 text-white rounded"
                disabled={update.isPending}
                onClick={() => update.mutate({ id: job.id, status: 'assigned' })}
              >
                Accept
              </button>
              <Link href={`/dashboard/requests/${job.id}`} className="text-gray-600 hover:underline">
                Details →
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
