'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUpdateRequest } from '@/hooks/useUpdateRequest';
import { useJobDetail } from '@/hooks/useJobDetail';
import Link from 'next/link';

type AddrState = { text: string; loading: boolean; cached: boolean };

type ReverseGeoResponse = {
  display_name?: string;
  cached?: boolean;
  components?: Record<string, unknown> | null;
  found?: boolean;
  error?: string;
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
  mutate: (
    payload: { id: number; status: 'assigned' | 'completed' },
    opts?: { onSuccess?: () => void; onError?: (e: unknown) => void }
  ) => void;
  isPending?: boolean;
  isLoading?: boolean;
};

export default function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params) as unknown as { id: string };

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

  const update = useUpdateRequest() as unknown as UpdateMutation;
  const [error, setError] = useState<string | null>(null);

  // address UI states
  const [pickupAddr, setPickupAddr] = useState<AddrState>({
    text: '',
    loading: false,
    cached: false,
  });
  const [dropoffAddr, setDropoffAddr] = useState<AddrState>({
    text: '',
    loading: false,
    cached: false,
  });

  useEffect(() => {
    if (!isLoading && !isError && !ride) {
      router.replace('/dashboard/requests');
    }
  }, [isLoading, isError, ride, router]);

  // Robust fetch helper
  async function safeFetchJson(url: string, opts: RequestInit = {}): Promise<SafeFetchResult> {
    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        ...opts,
      });
      const text = await res.text();
      let parsed: ReverseGeoResponse | null = null;
      try {
        if (text) {
          const raw = JSON.parse(text) as unknown;
          if (typeof raw === 'object' && raw !== null) {
            parsed = raw as ReverseGeoResponse;
          }
        }
      } catch {
        parsed = null;
      }
      return { ok: res.ok, status: res.status, json: parsed, text };
    } catch (err) {
      return { ok: false, status: 0, json: null, text: null, error: err };
    }
  }

  // fetch single address and set state
  const fetchAddress = async (
    lat: number | undefined | null,
    lon: number | undefined | null,
    setState: React.Dispatch<React.SetStateAction<AddrState>>,
    signal?: AbortSignal
  ) => {
    if (lat == null || lon == null) {
      setState({ text: '(no coordinates)', loading: false, cached: false });
      return;
    }

    setState(prev => ({ ...prev, loading: true }));

    const base = process.env.NEXT_PUBLIC_API_URL ?? '';
    const url = `${base}/api/reverse-geocode?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`;

    const opts: RequestInit = signal ? { signal } : {};

    // If your API uses Sanctum cookies, add: opts.credentials = 'include';

    const { status, json, error } = await safeFetchJson(url, opts);

    if (json && typeof json.display_name === 'string') {
      setState({ text: json.display_name, loading: false, cached: !!json.cached });
      return;
    }

    // handle common statuses with friendly messages
    if (status === 401) {
      setState({
        text: `Sign in to look up address — (${Number(lat).toFixed(5)}, ${Number(lon).toFixed(5)})`,
        loading: false,
        cached: false,
      });
      return;
    }

    if (status === 404) {
      setState({
        text: `Address not found — (${Number(lat).toFixed(5)}, ${Number(lon).toFixed(5)})`,
        loading: false,
        cached: false,
      });
      return;
    }

    if (error) {
      // safe logging
      // eslint-disable-next-line no-console
      console.warn('Reverse geocode fetch failed', error);
      setState({
        text: `Lookup failed — (${Number(lat).toFixed(5)}, ${Number(lon).toFixed(5)})`,
        loading: false,
        cached: false,
      });
      return;
    }

    // final fallback: coordinates
    setState({ text: `(${Number(lat).toFixed(5)}, ${Number(lon).toFixed(5)})`, loading: false, cached: false });
  };

  // When ride loads, fetch pickup/dropoff addresses
  useEffect(() => {
    if (!ride) return;
    const ac = new AbortController();
    const signal = ac.signal;

    fetchAddress(ride.pickup_lat, ride.pickup_lng, setPickupAddr, signal);

    if (ride.dropoff_lat != null && ride.dropoff_lng != null) {
      fetchAddress(ride.dropoff_lat, ride.dropoff_lng, setDropoffAddr, signal);
    }

    return () => ac.abort();
  }, [ride?.pickup_lat, ride?.pickup_lng, ride?.dropoff_lat, ride?.dropoff_lng, ride]);

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

  const isUpdating = !!(update.isPending ?? update.isLoading);

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
        <div className="py-2 flex justify-between items-start">
          <dt className="font-semibold">Pickup</dt>
          <dd className="max-w-[60%]">
            <div className="flex items-center gap-2">
              <p className="text-sm truncate" title={pickupAddr.text}>
                {pickupAddr.loading
                  ? 'Searching address…'
                  : pickupAddr.text || `(${Number(ride.pickup_lat).toFixed(5)}, ${Number(ride.pickup_lng).toFixed(5)})`}
              </p>
              {pickupAddr.cached && (
                <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded">cached</span>
              )}
            </div>
            <p className="text-xs text-zinc-500 font-mono mt-1">
              ({Number(ride.pickup_lat).toFixed(5)}, {Number(ride.pickup_lng).toFixed(5)})
            </p>
          </dd>
        </div>

        {ride.dropoff_lat != null && ride.dropoff_lng != null && (
          <div className="py-2 flex justify-between items-start">
            <dt className="font-semibold">Drop-off</dt>
            <dd className="max-w-[60%]">
              <div className="flex items-center gap-2">
                <p className="text-sm truncate" title={dropoffAddr.text}>
                  {dropoffAddr.loading
                    ? 'Searching address…'
                    : dropoffAddr.text || `(${Number(ride.dropoff_lat).toFixed(5)}, ${Number(ride.dropoff_lng).toFixed(5)})`}
                </p>
                {dropoffAddr.cached && (
                  <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded">cached</span>
                )}
              </div>
              <p className="text-xs text-zinc-500 font-mono mt-1">
                ({Number(ride.dropoff_lat).toFixed(5)}, {Number(ride.dropoff_lng).toFixed(5)})
              </p>
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
          disabled={isUpdating}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
        >
          {isUpdating ? 'Accepting…' : 'Accept Job'}
        </button>
      )}

      {ride.status === 'assigned' && (
        <button
          onClick={() => handleUpdate('completed')}
          disabled={isUpdating}
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition disabled:opacity-50"
        >
          {isUpdating ? 'Completing…' : 'Mark as Completed'}
        </button>
      )}

      {ride.status === 'completed' && (
        <p className="text-sm text-zinc-500 text-center italic">This request has been completed.</p>
      )}

      <Link href="/dashboard/requests" className="block text-sm text-indigo-600 hover:underline text-center">
        ← Back to list
      </Link>
    </div>
  );
}
