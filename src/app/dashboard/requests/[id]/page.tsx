'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useUpdateRequest } from '@/hooks/useUpdateRequest';
import { useIncomingJobs } from '@/hooks/useIncomingJobs';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = React.use(params);
    const { data, isLoading, isError } = useIncomingJobs();

    interface Ride {
        id: string | number;
        pickup_lat: number;
        pickup_lng: number;
        dropoff_lat?: number | null;
        dropoff_lng?: number | null;
        created_at: string;
    }

    const ride = data?.find((r: Ride) => String(r.id) === id);

    const update = useUpdateRequest();
    const [error, setError] = useState<string | null>(null);

    // Redirecting if data loaded and ride not found
    useEffect(() => {
        if (!isLoading && !isError && data && !ride) {
            router.replace('/dashboard/requests');
        }
    }, [ride, isLoading, isError, data, router]);

    if (isLoading) return <p>Loading…</p>;
    if (isError) return <p className="text-red-600">Failed to load jobs.</p>;
    if (!ride) return null; // Will redirect

    function onAccept() {
        setError(null);
        update.mutate(
            { id: ride.id, status: 'assigned' },
            {
                onSuccess: () => router.push('/dashboard/requests'),
                onError: (e: unknown) => {
                    let message = 'Failed to accept';
                    type ErrorWithResponse = {
                        response?: {
                            data?: {
                                message?: string;
                            };
                        };
                        message?: string;
                    };
                    if (typeof e === 'object' && e !== null) {
                        const err = e as ErrorWithResponse;
                        if (err.response?.data?.message && typeof err.response.data.message === 'string') {
                            message = err.response.data.message;
                        } else if (err.message && typeof err.message === 'string') {
                            message = err.message;
                        }
                    }
                    setError(message);
                },
            }
        );
    }

    return (
        <div className="max-w-lg mx-auto p-6 space-y-4">
            <h1 className="text-2xl font-bold">Request #{ride.id}</h1>
            {error && <p className="text-red-600">{error}</p>}

            <dl className="divide-y">
                <div className="py-2 flex justify-between">
                    <dt className="font-semibold">Pickup</dt>
                    <dd className="font-mono">({Number(ride.pickup_lat).toFixed(5)}, {Number(ride.pickup_lng).toFixed(5)})</dd>
                </div>
                {ride.dropoff_lat != null && ride.dropoff_lng != null && (
                    <div className="py-2 flex justify-between">
                        <dt className="font-semibold">Drop-off</dt>
                        <dd className="font-mono">({Number(ride.dropoff_lat).toFixed(5)}, {Number(ride.dropoff_lng).toFixed(5)})</dd>
                    </div>
                )}
                <div className="py-2 flex justify-between">
                    <dt className="font-semibold">Requested</dt>
                    <dd>{new Date(ride.created_at).toLocaleString()}</dd>
                </div>
            </dl>

            <button
                onClick={onAccept}
                disabled={update.isPending}
                className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
            >
                {update.isPending ? 'Accepting…' : 'Accept Job'}
            </button>

            <Link href="/dashboard/requests" className="text-sm text-gray-600 hover:underline">
                ← Back to list
            </Link>
        </div>
    );
}
