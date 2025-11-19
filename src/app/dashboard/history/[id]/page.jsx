'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useUpdateRequest } from '@/hooks/useUpdateRequest';
import React from 'react';
import api from '@/services/api';
import Link from 'next/link';

export default function RideDetailPage({ params }) {
  const { id } = React.use(params);
  const router = useRouter();
  const [ride, setRide] = useState(null);
  const [error, setError] = useState(null);
  const update = useUpdateRequest();

  // address UI states
  const [pickupAddr, setPickupAddr] = useState({ text: '', loading: false, cached: false });
  const [dropoffAddr, setDropoffAddr] = useState({ text: '', loading: false, cached: false });

  useEffect(() => {
    setError(null);
    api
      .get(`/api/requests/${id}`)
      .then(res => setRide(res.data))
      .catch(() => setError('Failed to load ride details'));
  }, [id]);

  // Robust fetch helper that returns { ok, status, json, text, error }
  async function safeFetchJson(url, opts = {}) {
    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        ...opts,
      });
      const text = await res.text();
      let json = null;
      try { json = text ? JSON.parse(text) : null; } catch { json = null; }
      return { ok: res.ok, status: res.status, json, text };
    } catch (err) {
      return { ok: false, status: 0, json: null, text: null, error: err };
    }
  }

  // fetch single address and set state
  const fetchAddress = async (lat, lon, setState, signal) => {
    if (lat == null || lon == null) {
      setState({ text: '(no coordinates)', loading: false, cached: false });
      return;
    }

    setState(prev => ({ ...prev, loading: true }));

    const base = process.env.NEXT_PUBLIC_API_URL ?? '';
    const url = `${base}/api/reverse-geocode?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`;

    // attach signal if available
    const opts = signal ? { signal } : {};

    const { ok, status, json, error } = await safeFetchJson(url, opts);

    // prefer display_name if present
    if (json && json.display_name) {
      setState({ text: json.display_name, loading: false, cached: !!json.cached });
      return;
    }

    // If server returned a display_name inside error payload (older behavior)
    if (json && json.display_name) {
      setState({ text: json.display_name, loading: false, cached: !!json.cached });
      return;
    }

    // Handle common statuses with friendly messages
    if (status === 401) {
      setState({ text: `Sign in to look up address — (${Number(lat).toFixed(5)}, ${Number(lon).toFixed(5)})`, loading: false, cached: false });
      return;
    }

    if (status === 404) {
      setState({ text: `Address not found — (${Number(lat).toFixed(5)}, ${Number(lon).toFixed(5)})`, loading: false, cached: false });
      return;
    }

    if (error) {
      console.warn('Reverse geocode fetch failed', error);
      setState({ text: `Lookup failed — (${Number(lat).toFixed(5)}, ${Number(lon).toFixed(5)})`, loading: false, cached: false });
      return;
    }

    // final fallback: coordinates
    setState({ text: `(${Number(lat).toFixed(5)}, ${Number(lon).toFixed(5)})`, loading: false, cached: false });
  };

  // When ride loads, fetch pickup/dropoff addresses
  useEffect(() => {
    if (!ride) return;
    const abortController = new AbortController();
    const signal = abortController.signal;

    fetchAddress(ride.pickup_lat, ride.pickup_lng, setPickupAddr, signal);
    fetchAddress(ride.dropoff_lat, ride.dropoff_lng, setDropoffAddr, signal);

    return () => abortController.abort();
  }, [ride?.pickup_lat, ride?.pickup_lng, ride?.dropoff_lat, ride?.dropoff_lng, ride]);

  const handleUpdate = (status) => {
    if (!ride) return;
    setError(null);
    update.mutate(
      { id: ride.id, status },
      {
        onSuccess: () => {
          setTimeout(() => {
            router.push('/dashboard/history');
          }, 700); // 700ms delay to show "Cancelling…"
        },
        onError: (e) =>
          setError(e?.response?.data?.message || 'Failed to update ride'),
      }
    );
  };

  if (error) return <p className="text-red-600 p-4">{error}</p>;
  if (!ride) return <p className="p-4">Loading…</p>;

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <dl className="divide-y divide-zinc-200 text-sm text-zinc-700">
        <div className="py-2 flex justify-between">
          <dt className="font-semibold text-zinc-600">Status</dt>
          <dd className="capitalize">{ride.status.replace('_', ' ')}</dd>
        </div>

        <div className="py-2 flex justify-between">
          <dt className="font-semibold text-zinc-600">Requested At</dt>
          <dd>{new Date(ride.created_at).toLocaleString()}</dd>
        </div>

        {ride.started_at && (
          <div className="py-2 flex justify-between">
            <dt className="font-semibold text-zinc-600">Started At</dt>
            <dd>{new Date(ride.started_at).toLocaleString()}</dd>
          </div>
        )}

        {ride.completed_at && (
          <div className="py-2 flex justify-between">
            <dt className="font-semibold text-zinc-600">Completed At</dt>
            <dd>{new Date(ride.completed_at).toLocaleString()}</dd>
          </div>
        )}

        <div className="py-2 flex justify-between items-start">
          <dt className="font-semibold text-zinc-600">Pickup</dt>
          <dd className="max-w-[60%]">
            <div className="flex items-center gap-2">
              <p className="text-sm truncate" title={pickupAddr.text}>
                {pickupAddr.loading ? 'Searching address…' : pickupAddr.text || `(${Number(ride.pickup_lat).toFixed(5)}, ${Number(ride.pickup_lng).toFixed(5)})`}
              </p>
              {pickupAddr.cached && (
                <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded">cached</span>
              )}
            </div>
            <p className="text-xs text-zinc-500 font-mono mt-1">
              {Number(ride.pickup_lat).toFixed(5)}, {Number(ride.pickup_lng).toFixed(5)}
            </p>
          </dd>
        </div>

        <div className="py-2 flex justify-between items-start">
          <dt className="font-semibold text-zinc-600">Drop-off</dt>
          <dd className="max-w-[60%]">
            <div className="flex items-center gap-2">
              <p className="text-sm truncate" title={dropoffAddr.text}>
                {dropoffAddr.loading ? 'Searching address…' : dropoffAddr.text || `(${Number(ride.dropoff_lat).toFixed(5)}, ${Number(ride.dropoff_lng).toFixed(5)})`}
              </p>
              {dropoffAddr.cached && (
                <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded">cached</span>
              )}
            </div>
            <p className="text-xs text-zinc-500 font-mono mt-1">
              {Number(ride.dropoff_lat).toFixed(5)}, {Number(ride.dropoff_lng).toFixed(5)}
            </p>
          </dd>
        </div>
      </dl>

      {ride.status === 'pending' && (
        <button
          onClick={() => handleUpdate('cancelled')}
          disabled={update.isLoading}
          className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 transition disabled:opacity-50"
        >
          {update.isLoading ? 'Cancelling…' : 'Cancel Ride'}
        </button>
      )}

      {ride.status === 'assigned' && (
        <button
          onClick={() => handleUpdate('completed')}
          disabled={update.isLoading}
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition disabled:opacity-50"
        >
          {update.isLoading ? 'Completing…' : 'Mark as Completed'}
        </button>
      )}

      <Link
        href="/dashboard/history"
        className="block text-center text-sm text-indigo-600 hover:underline mt-4"
      >
        ← Back to My Rides
      </Link>
    </div>
  );
}
