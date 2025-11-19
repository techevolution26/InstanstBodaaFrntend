'use client';

import React, { useEffect, useState } from 'react';
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

type AddrState = { text: string; loading: boolean; cached: boolean };

type ReverseGeoResponse = {
  display_name?: string;
  cached?: boolean;
  [k: string]: unknown;
};

type SafeFetchResult = {
  ok: boolean;
  status: number;
  json: ReverseGeoResponse | null;
  text: string | null;
  error?: unknown;
};

type UpdateMutation = {
  mutate: (payload: { id: number; status: 'assigned' | 'completed' }, opts?: { onSuccess?: () => void; onError?: (e: unknown) => void }) => void;
  isPending?: boolean;
  isLoading?: boolean;
};

function safeFetchJson(url: string, opts: RequestInit = {}): Promise<SafeFetchResult> {
  return fetch(url, { headers: { Accept: 'application/json' }, ...opts })
    .then(async (res) => {
      const text = await res.text();
      let parsed: ReverseGeoResponse | null = null;
      try {
        if (text) {
          const raw = JSON.parse(text) as unknown;
          if (typeof raw === 'object' && raw !== null) parsed = raw as ReverseGeoResponse;
        }
      } catch {
        parsed = null;
      }
      return { ok: res.ok, status: res.status, json: parsed, text };
    })
    .catch((error) => ({ ok: false, status: 0, json: null, text: null, error }));
}

/**
 * Row component that handles reverse-geocoding for a single job's pickup.
 * Isolated so each row gets its own AbortController and state.
 */
function JobRow({ job, onAccept }: { job: Job; onAccept: (id: number) => void }) {
  const [addr, setAddr] = useState<AddrState>({ text: '', loading: false, cached: false });

  useEffect(() => {
    let mounted = true;
    const ac = new AbortController();

    async function fetchPickup() {
      setAddr((prev) => ({ ...prev, loading: true }));
      const base = process.env.NEXT_PUBLIC_API_URL ?? '';
      const url = `${base}/api/reverse-geocode?lat=${encodeURIComponent(String(job.pickup_lat))}&lon=${encodeURIComponent(String(job.pickup_lng))}`;

      const result = await safeFetchJson(url, { signal: ac.signal });

      if (!mounted) return;

      if (result.json && typeof result.json.display_name === 'string') {
        setAddr({ text: result.json.display_name, loading: false, cached: !!result.json.cached });
        return;
      }

      if (result.status === 401) {
        setAddr({ text: `Sign in to lookup address — (${Number(job.pickup_lat).toFixed(5)}, ${Number(job.pickup_lng).toFixed(5)})`, loading: false, cached: false });
        return;
      }

      if (result.status === 404) {
        setAddr({ text: `Address not found — (${Number(job.pickup_lat).toFixed(5)}, ${Number(job.pickup_lng).toFixed(5)})`, loading: false, cached: false });
        return;
      }

      if (result.error) {
        // eslint-disable-next-line no-console
        console.warn('Reverse geocode error', result.error);
        setAddr({ text: `Lookup failed — (${Number(job.pickup_lat).toFixed(5)}, ${Number(job.pickup_lng).toFixed(5)})`, loading: false, cached: false });
        return;
      }

      setAddr({ text: `(${Number(job.pickup_lat).toFixed(5)}, ${Number(job.pickup_lng).toFixed(5)})`, loading: false, cached: false });
    }

    fetchPickup();

    return () => {
      mounted = false;
      ac.abort();
    };
  }, [job.pickup_lat, job.pickup_lng, job.id]);

  return (
    <li
      key={job.id}
      className="p-4 bg-white border border-zinc-200 rounded-lg shadow-sm hover:shadow-md transition flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
    >
      <div>
        <p className="text-sm text-zinc-700 font-medium mb-1">
          Request <span className="font-bold">#{job.id}</span>{' '}
          <span
            className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded-full ${job.status === 'completed' ? 'bg-green-100 text-green-700' : job.status === 'assigned' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
              }`}
          >
            {job.status}
          </span>
        </p>

        <div>
          <p className="text-sm text-zinc-500">
            {addr.loading ? 'Searching address…' : addr.text || `(${Number(job.pickup_lat).toFixed(5)}, ${Number(job.pickup_lng).toFixed(5)})`}
            {addr.cached && <span className="ml-2 text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded">cached</span>}
          </p>
          <p className="text-xs text-zinc-500 font-mono mt-1">({Number(job.pickup_lat).toFixed(5)}, {Number(job.pickup_lng).toFixed(5)})</p>
        </div>
      </div>

      <div className="flex gap-3 sm:justify-end">
        {job.status === 'pending' && (
          <button
            onClick={() => onAccept(job.id)}
            className="px-4 py-1.5 text-sm font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Accept
          </button>
        )}

        <Link href={`/dashboard/requests/${job.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-zinc-600 hover:underline">
          Details <ArrowTopRightOnSquareIcon className="w-4 h-4" />
        </Link>
      </div>
    </li>
  );
}

export default function ProviderQueuePage() {
  const { data, isLoading, isError } = usePendingRequests();
  // type the mutation to avoid any
  const update = useUpdateRequest() as unknown as UpdateMutation;

  if (isLoading) return <p className="text-sm text-zinc-500">Loading incoming jobs…</p>;
  if (isError) return <p className="text-sm text-red-500">Failed to load jobs.</p>;

  const jobs: Job[] = (data?.data as Job[]) ?? [];

  const handleAccept = (id: number) => {
    update.mutate({ id, status: 'assigned' }, { onError: () => {/* optional error handling */ } });
  };

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
            <JobRow key={job.id} job={job} onAccept={handleAccept} />
          ))}
        </ul>
      )}
    </div>
  );
}
