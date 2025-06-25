'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useUpdateRequest } from '@/hooks/useUpdateRequest';
import { useJobDetail } from '@/hooks/useJobDetail';
import { useEffect, useState } from 'react';
import Link from 'next/link';

// Ride interface removed as it was not used directly

export default function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);

  const { data: ride, isLoading, isError } = useJobDetail(id) as {
    data: {
      id: number;
      pickup_lat: number;
      pickup_lng: number;
      dropoff_lat?: number | null;
      dropoff_lng?: number | null;
      created_at: string;
      status?: 'pending' | 'assigned' | 'completed';
    } | null;
    isLoading: boolean;
    isError: boolean;
  };
  const update = useUpdateRequest();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isError && !ride) {
      router.replace('/dashboard/requests');
    }
  }, [isLoading, isError, ride, router]);

  const handleUpdate = (nextStatus: 'assigned' | 'completed') => {
    setError(null);
    if (!ride) return;
    update.mutate(
      { id: ride.id, status: nextStatus },
      {
        onSuccess: () => router.push('/dashboard/requests'),
        onError: (e: unknown) => {
          let message = 'Failed to update';
          if (typeof e === 'object' && e !== null && 'message' in e) {
            message = (e as { message: string }).message;
          }
          setError(message);
        },
      }
    );
  };

  if (isLoading) return <p>Loading…</p>;
  if (isError) return <p className="text-red-600">Failed to load job.</p>;
  if (!ride) return null;
  const statusColorMap: Record<'pending' | 'assigned' | 'completed', string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    assigned: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
  };

  const statusColor = statusColorMap[(ride.status ?? 'pending') as 'pending' | 'assigned' | 'completed'];

  const secondsAgo = Math.floor((Date.now() - new Date(ride.created_at).getTime()) / 1000);
  const timeAgo =
    secondsAgo < 60
      ? `${secondsAgo}s ago`
      : secondsAgo < 3600
      ? `${Math.floor(secondsAgo / 60)}m ago`
      : secondsAgo < 86400
      ? `${Math.floor(secondsAgo / 3600)}h ago`
      : `${Math.floor(secondsAgo / 86400)}d ago`;

  return (
    <div className="max-w-lg mx-auto p-6 space-y-6">

      <div className="flex justify-center gap-4 text-xs">
        <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 font-medium">Pending</span>
        <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">Assigned</span>
        <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">Completed</span>
      </div>

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Request #{ride.id}</h1>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColor}`}>
          {ride.status} • {timeAgo}
        </span>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <dl className="divide-y text-sm">
        <div className="py-2 flex justify-between">
          <dt className="font-semibold">Pickup</dt>
          <dd className="font-mono">
            ({Number(ride.pickup_lat).toFixed(5)}, {Number(ride.pickup_lng).toFixed(5)})
          </dd>
        </div>
        {ride.dropoff_lat != null && ride.dropoff_lng != null && (
          <div className="py-2 flex justify-between">
            <dt className="font-semibold">Drop-off</dt>
            <dd className="font-mono">
              ({Number(ride.dropoff_lat).toFixed(5)}, {Number(ride.dropoff_lng).toFixed(5)})
            </dd>
          </div>
        )}
        <div className="py-2 flex justify-between">
          <dt className="font-semibold">Requested</dt>
          <dd>{new Date(ride.created_at).toLocaleString()}</dd>
        </div>
      </dl>

      {ride.status === 'pending' && (
        <button
          onClick={() => handleUpdate('assigned')}
          disabled={update.isPending}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
        >
          {update.isPending ? 'Accepting…' : 'Accept Job'}
        </button>
      )}

      {ride.status === 'assigned' && (
        <button
          onClick={() => handleUpdate('completed')}
          disabled={update.isPending}
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition disabled:opacity-50"
        >
          {update.isPending ? 'Completing…' : 'Mark as Completed'}
        </button>
      )}

      {ride.status === 'completed' && (
        <p className="text-sm text-zinc-500 text-center italic">
          This request has been completed.
        </p>
      )}

      <Link
        href="/dashboard/requests"
        className="block text-sm text-indigo-600 hover:underline text-center"
      >
        ← Back to list
      </Link>
    </div>
  );
}
