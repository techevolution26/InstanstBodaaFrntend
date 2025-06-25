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

    // Fetching the ride on mount
    useEffect(() => {
        api
            .get(`/api/requests/${id}`)
            .then(res => setRide(res.data))
            .catch(() => setError('Failed to load ride details'));
    }, [id]);

    // Handler to mark the ride completed
    const markComplete = () => {
        if (!ride) return;
        setError(null);
        update.mutate(
            { id: ride.id, status: 'completed' },
            {
                onSuccess: () => router.push('/dashboard/history'),
                onError: (e) =>
                    setError(e.response?.data?.message || 'Failed to complete ride'),
            }
        );
    };

    if (error) return <p className="text-red-600 p-4">{error}</p>;
    if (!ride) return <p className="p-4">Loading…</p>;

    // Determining if the ride can be completed
    const canComplete = ride.status !== 'completed' && ride.status !== 'cancelled';

    return (
        <div className="max-w-xl mx-auto p-4">
            <dl className="divide-y">
                <div className="py-2 flex justify-between">
                    <dt className="font-semibold">Status</dt>
                    <dd className="capitalize">{ride.status.replace('_', ' ')}</dd>
                </div>
                <div className="py-2 flex justify-between">
                    <dt className="font-semibold">Requested At</dt>
                    <dd>{new Date(ride.created_at).toLocaleString()}</dd>
                </div>
                {ride.started_at && (
                    <div className="py-2 flex justify-between">
                        <dt className="font-semibold">Started At</dt>
                        <dd>{new Date(ride.started_at).toLocaleString()}</dd>
                    </div>
                )}
                {ride.completed_at && (
                    <div className="py-2 flex justify-between">
                        <dt className="font-semibold">Completed At</dt>
                        <dd>{new Date(ride.completed_at).toLocaleString()}</dd>
                    </div>
                )}
                <div className="py-2 flex justify-between">
                    <dt className="font-semibold">Pickup</dt>
                    <dd>
                        {Number(ride.pickup_lat).toFixed(5)}, {Number(ride.pickup_lng).toFixed(5)}
                    </dd>
                </div>
                <div className="py-2 flex justify-between">
                    <dt className="font-semibold">Drop-off</dt>
                    <dd>
                        {Number(ride.dropoff_lat).toFixed(5)}, {Number(ride.dropoff_lng).toFixed(5)}
                    </dd>
                </div>
            </dl>

            {canComplete && (
                <button
                    onClick={markComplete}
                    disabled={update.isLoading}
                    className="w-full bg-green-600 text-white py-2 rounded disabled:opacity-50"
                >
                    {update.isLoading ? 'Completing…' : 'Mark as Completed'}
                </button>
            )}

            <Link
                href="/dashboard/history"
                className="block text-center text-indigo-600 hover:underline mt-4"
            >
                ← Back to My Rides
            </Link>
        </div>
    );
}
