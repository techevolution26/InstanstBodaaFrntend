'use client';

import { useState } from 'react';
import { useCreateRequest } from '@/hooks/useCreateRequest';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';

const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false });

export default function CreateRidePage() {
  const mutate = useCreateRequest();
  const router = useRouter();

  const [pickup, setPickup] = useState<[number, number]>([-1.2921, 36.8219]);
  const [dropoff, setDropoff] = useState<[number, number]>([-1.2921, 36.8319]);
  const [type, setType] = useState<'ride' | 'delivery'>('ride');
  const [error, setError] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await mutate.mutateAsync({
        pickup_lat: pickup[0],
        pickup_lng: pickup[1],
        dropoff_lat: dropoff[0],
        dropoff_lng: dropoff[1],
        type,
      });
      toast.success(`${type === 'ride' ? 'Ride' : 'Delivery'} requested!`);
      router.push('/dashboard/history');
    } catch (err: unknown) {
      let message = 'Failed to request ride';
      interface ErrorResponse {
        response?: {
          data?: {
            message?: string;
          };
        };
      }

      if (
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        typeof (err as ErrorResponse).response === 'object' &&
        (err as ErrorResponse).response !== null &&
        'data' in (err as ErrorResponse).response! &&
        typeof (err as ErrorResponse).response!.data === 'object' &&
        (err as ErrorResponse).response!.data !== null &&
        'message' in (err as ErrorResponse).response!.data!
      ) {
        message = (err as ErrorResponse).response!.data!.message as string;
      }
      setError(message);
      toast.error(message);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-zinc-800">Request a Ride / Delivery</h1>
      {error && <p className="text-sm text-red-600 border border-red-200 bg-red-50 px-3 py-2 rounded">{error}</p>}

      <div className="space-y-4">
        {/* Type Selector */}
        <div className="w-full">
          <label htmlFor="type" className="block text-sm font-medium text-zinc-700 mb-1">
            Request Type
          </label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value as 'ride' | 'delivery')}
            className="w-full border border-zinc-300 rounded px-3 py-2 bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
          >
            <option value="ride">Ride</option>
            <option value="delivery">Delivery</option>
          </select>
        </div>

        <MapPicker
          label="Pickup Location"
          position={pickup}
          setPosition={setPickup}
        />
        {/* <p className="text-sm text-zinc-500">Pickup: ({pickup[0].toFixed(5)}, {pickup[1].toFixed(5)})</p> */}

        <MapPicker
          label="Drop-off Location"
          position={dropoff}
          setPosition={setDropoff}
        />
        {/* <p className="text-sm text-zinc-500">Dropoff: ({dropoff[0].toFixed(5)}, {dropoff[1].toFixed(5)})</p> */}
      </div>

      <button
        onClick={onSubmit}
        className="w-full px-4 py-2 text-white font-medium bg-zinc-700 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400 rounded transition disabled:opacity-50"
        disabled={mutate.status === 'pending'}
      >
        {mutate.status === 'pending' ? 'Requesting…' : `Confirm ${type === 'ride' ? 'Ride' : 'Delivery'}`}
      </button>
    </div>
  );
}
