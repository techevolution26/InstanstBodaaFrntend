// src/app/dashboard/request/page.tsx
'use client';

import { useState } from 'react';
import { useCreateRequest } from '@/hooks/useCreateRequest';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// load MapPicker only on the client
const MapPicker = dynamic(() => import('@/components/MapPicker'), {
  ssr: false,
});

export default function CreateRidePage() {
  const mutate = useCreateRequest();
  const router = useRouter();

  // default to a city center
  const [pickup,  setPickup]  = useState<[number,number]>([-1.2921, 36.8219]);
  const [dropoff, setDropoff] = useState<[number,number]>([-1.2921, 36.8319]);
  const [error, setError]     = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await mutate.mutateAsync({
        pickup_lat:  pickup[0],
        pickup_lng:  pickup[1],
        dropoff_lat: dropoff[0],
        dropoff_lng: dropoff[1],
      });
      router.push('/dashboard/history');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'message' in err.response.data) {
        setError((err.response as { data: { message?: string } }).data.message || 'Failed to request ride');
      } else {
        setError('Failed to request ride');
      }
    }
  }

  return (
    <div className="max-w-lg mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Request a Ride / Delivery</h1>
      {error && <p className="text-red-600">{error}</p>}

      <MapPicker
        label="Pickup Location"
        position={pickup}
        setPosition={setPickup}
      />
      <MapPicker
        label="Drop-off Location"
        position={dropoff}
        setPosition={setDropoff}
      />

      <button
        onClick={onSubmit}
        className="w-full bg-green-600 text-white py-2 rounded disabled:opacity-50"
        disabled={mutate.status === 'pending'}
      >
        {mutate.status === 'pending' ? 'Requesting…' : 'Confirm Request'}
      </button>
    </div>
  );
}
