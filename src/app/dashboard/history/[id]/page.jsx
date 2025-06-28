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

  useEffect(() => {
    api
      .get(`/api/requests/${id}`)
      .then(res => setRide(res.data))
      .catch(() => setError('Failed to load ride details'));
  }, [id]);

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

        <div className="py-2 flex justify-between">
          <dt className="font-semibold text-zinc-600">Pickup</dt>
          <dd className="font-mono">
            {Number(ride.pickup_lat).toFixed(5)}, {Number(ride.pickup_lng).toFixed(5)}
          </dd>
        </div>

        <div className="py-2 flex justify-between">
          <dt className="font-semibold text-zinc-600">Drop-off</dt>
          <dd className="font-mono">
            {Number(ride.dropoff_lat).toFixed(5)}, {Number(ride.dropoff_lng).toFixed(5)}
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


// 'use client';

// import { useRouter } from 'next/navigation';
// import { useEffect, useState } from 'react';
// import { useUpdateRequest } from '@/hooks/useUpdateRequest';
// import api from '@/services/api';
// import Link from 'next/link';

// interface Ride {
//   id: number;
//   status: 'pending' | 'assigned' | 'completed' | 'cancelled' | string;
//   pickup_lat: number | string;
//   pickup_lng: number | string;
//   dropoff_lat: number | string;
//   dropoff_lng: number | string;
//   created_at: string;
//   started_at?: string;
//   completed_at?: string;
// }

// interface Params {
//   params: { id: string };
// }

// export default function RideDetailPage({ params }: Params) {
//   const { id } = params;
//   const router = useRouter();
//   const update = useUpdateRequest();

//   const [ride, setRide] = useState<Ride | null>(null);
//   const [error, setError] = useState<string | null>(null);

//   // Humanized addresses
//   const [pickupAddr, setPickupAddr] = useState<string>('');
//   const [dropoffAddr, setDropoffAddr] = useState<string>('');

//   // Fallback formatter
//   const fmt = (v: number | string) => Number(v).toFixed(5);

//   // Reverse-geocode + cache lookup
//   const fetchAddress = async (
//     lat: number | string,
//     lon: number | string,
//     setter: (s: string) => void
//   ) => {
//     try {
//       const res = await fetch(
//         `${process.env.NEXT_PUBLIC_API_URL}/api/reverse-geocode?lat=${lat}&lon=${lon}`
//       );
//       const payload = await res.json();
//       if (res.ok && payload.display_name) {
//         setter(payload.display_name as string);
//         return;
//       }
//     } catch {
//       // no-op
//     }
//     // fallback to raw coords
//     setter(`(${fmt(lat)}, ${fmt(lon)})`);
//   };

//   // 1) Load ride + prime addresses
//   useEffect(() => {
//     api
//       .get<Ride>(`/api/requests/${id}`)
//       .then(({ data }) => {
//         setRide(data);
//         fetchAddress(data.pickup_lat, data.pickup_lng, setPickupAddr);
//         fetchAddress(data.dropoff_lat, data.dropoff_lng, setDropoffAddr);
//       })
//       .catch(() => setError('Failed to load ride details'));
//   }, [id]);

//   // 2) Update status handler
//   const handleUpdate = (newStatus: Ride['status']) => {
//     if (!ride) return;
//     setError(null);

//     update.mutate(
//       { id: ride.id, status: newStatus },
//       {
//         onSuccess: () => {
//           // brief delay for UX
//           setTimeout(() => {
//             router.push('/dashboard/history');
//           }, 700);
//         },
//         onError: (e: any) => {
//           setError(e?.response?.data?.message || 'Failed to update ride');
//         },
//       }
//     );
//   };

//   if (error) {
//     return <p className="text-red-600 p-4">{error}</p>;
//   }
//   if (!ride) {
//     return <p className="p-4">Loading…</p>;
//   }

//   return (
//     <div className="max-w-xl mx-auto p-6 space-y-6">
//       <dl className="divide-y divide-zinc-200 text-sm text-zinc-700">
//         {/* Status */}
//         <div className="py-2 flex justify-between">
//           <dt className="font-semibold text-zinc-600">Status</dt>
//           <dd className="capitalize">{ride.status.replace('_', ' ')}</dd>
//         </div>

//         {/* Requested At */}
//         <div className="py-2 flex justify-between">
//           <dt className="font-semibold text-zinc-600">Requested At</dt>
//           <dd>{new Date(ride.created_at).toLocaleString()}</dd>
//         </div>

//         {/* Started / Completed */}
//         {ride.started_at && (
//           <div className="py-2 flex justify-between">
//             <dt className="font-semibold text-zinc-600">Started At</dt>
//             <dd>{new Date(ride.started_at).toLocaleString()}</dd>
//           </div>
//         )}
//         {ride.completed_at && (
//           <div className="py-2 flex justify-between">
//             <dt className="font-semibold text-zinc-600">Completed At</dt>
//             <dd>{new Date(ride.completed_at).toLocaleString()}</dd>
//           </div>
//         )}

//         {/* Pickup Address */}
//         <div className="py-2 flex flex-col sm:flex-row sm:justify-between">
//           <dt className="font-semibold text-zinc-600">Pickup</dt>
//           <dd
//             className="font-mono truncate max-w-xs"
//             title={pickupAddr}
//           >
//             {pickupAddr || `(${fmt(ride.pickup_lat)}, ${fmt(ride.pickup_lng)})`}
//           </dd>
//         </div>

//         {/* Drop-off Address */}
//         <div className="py-2 flex flex-col sm:flex-row sm:justify-between">
//           <dt className="font-semibold text-zinc-600">Drop-off</dt>
//           <dd
//             className="font-mono truncate max-w-xs"
//             title={dropoffAddr}
//           >
//             {dropoffAddr || `(${fmt(ride.dropoff_lat)}, ${fmt(ride.dropoff_lng)})`}
//           </dd>
//         </div>
//       </dl>

//       {/* Actions */}
//       {ride.status === 'pending' && (
//         <button
//           onClick={() => handleUpdate('cancelled')}
//           disabled={update.isLoading}
//           className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 transition disabled:opacity-50"
//         >
//           {update.isLoading ? 'Cancelling…' : 'Cancel Ride'}
//         </button>
//       )}
//       {ride.status === 'assigned' && (
//         <button
//           onClick={() => handleUpdate('completed')}
//           disabled={update.isLoading}
//           className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition disabled:opacity-50"
//         >
//           {update.isLoading ? 'Completing…' : 'Mark as Completed'}
//         </button>
//       )}

//       <Link
//         href="/dashboard/history"
//         className="block text-center text-sm text-indigo-600 hover:underline mt-4"
//       >
//         ← Back to My Rides
//       </Link>
//     </div>
//   );
// }
