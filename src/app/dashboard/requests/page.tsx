'use client';

import { usePendingRequests } from '@/hooks/usePendingRequests';
import { useUpdateRequest } from '@/hooks/useUpdateRequest';
import Link from 'next/link';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

interface Job {
  id: number;
  status: 'pending' | 'assigned' | 'completed';
  pickup_lat: number;
  pickup_lng: number;
}

export default function ProviderQueuePage() {
  const { data, isLoading, isError } = usePendingRequests();
  const update = useUpdateRequest();

  if (isLoading) return <p className="text-sm text-zinc-500">Loading incoming jobs…</p>;
  if (isError) return <p className="text-sm text-red-500">Failed to load jobs.</p>;

  const jobs: Job[] = data?.data ?? [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4">
      <h1 className="text-2xl font-bold text-zinc-800">Pending Requests</h1>

      {jobs.length === 0 ? (
        <div className="text-center text-zinc-500 border rounded p-8 bg-zinc-50">
          <p>No pending requests at the moment.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {jobs.map((job) => (
            <li
              key={job.id}
              className="p-4 bg-white border border-zinc-200 rounded-lg shadow-sm hover:shadow-md transition flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
              <div>
                <p className="text-sm text-zinc-700 font-medium mb-1">
                  Request <span className="font-bold">#{job.id}</span>{' '}
                  <span
                    className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded-full ${job.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : job.status === 'assigned'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                  >
                    {job.status}
                  </span>
                </p>
                <p className="text-sm text-zinc-500 font-mono">
                  ({Number(job.pickup_lat).toFixed(5)}, {Number(job.pickup_lng).toFixed(5)})
                </p>
              </div>

              <div className="flex gap-3 sm:justify-end">
                {job.status === 'pending' && (
                  <button
                    onClick={() => update.mutate({ id: job.id, status: 'assigned' })}
                    disabled={update.isPending}
                    className="px-4 py-1.5 text-sm font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    Accept
                  </button>
                )}
                <Link
                  href={`/dashboard/requests/${job.id}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-zinc-600 hover:underline"
                >
                  Details <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
