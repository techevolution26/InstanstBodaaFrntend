// src/app/dashboard/request/page.tsx
'use client';

import { useState } from 'react';
import { useCreateRequest } from  '@/hooks/useCreateRequest';
import { useRouter } from 'next/navigation';

export default function CreateRidePage() {
  const mutate = useCreateRequest();
  const router = useRouter();
  const [pickupLat, setPickupLat] = useState('');
  const [pickupLng, setPickupLng] = useState('');
  const [dropoffLat, setDropoffLat] = useState('');
  const [dropoffLng, setDropoffLng] = useState('');
  const [error, setError] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await mutate.mutateAsync({
        pickup_lat: parseFloat(pickupLat),
        pickup_lng: parseFloat(pickupLng),
        dropoff_lat: parseFloat(dropoffLat),
        dropoff_lng: parseFloat(dropoffLng),
      });
      router.push('/dashboard'); // back to history
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'message' in err.response.data) {
        setError((err as { response: { data: { message: string } } }).response.data.message);
      } else {
        setError('Failed to request ride');
      }
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">New Ride / Delivery</h1>
      {error && <p className="text-red-600">{error}</p>}
      <form onSubmit={onSubmit} className="space-y-2">
        <input
          type="text"
          placeholder="Pickup Latitude"
          value={pickupLat}
          onChange={e => setPickupLat(e.target.value)}
          className="w-full border px-2 py-1 rounded"
          required
        />
        <input
          type="text"
          placeholder="Pickup Longitude"
          value={pickupLng}
          onChange={e => setPickupLng(e.target.value)}
          className="w-full border px-2 py-1 rounded"
          required
        />
        <input
          type="text"
          placeholder="Dropoff Latitude"
          value={dropoffLat}
          onChange={e => setDropoffLat(e.target.value)}
          className="w-full border px-2 py-1 rounded"
          required
        />
        <input
          type="text"
          placeholder="Dropoff Longitude"
          value={dropoffLng}
          onChange={e => setDropoffLng(e.target.value)}
          className="w-full border px-2 py-1 rounded"
          required
        />
        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 rounded disabled:opacity-50"
          disabled={mutate.status === 'pending'}
        >
          {mutate.status === 'pending' ? 'Requesting…' : 'Request Ride'}
        </button>
      </form>
    </div>
  );
}
