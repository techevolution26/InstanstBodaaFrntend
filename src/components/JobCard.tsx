'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
    MapPinIcon,
    ClockIcon,
    TruckIcon,
    AcademicCapIcon,
    ArrowTopRightOnSquareIcon,
    ArrowRightIcon,
} from '@heroicons/react/24/outline';

type JobCardProps = {
    id: number;
    pickup_lat: number;
    pickup_lng: number;
    dropoff_lat?: number;
    dropoff_lng?: number;
    created_at?: string;
    type?: 'ride' | 'delivery';
    status?: 'pending' | 'assigned' | 'completed';
};

export default function JobCard({
    id,
    pickup_lat,
    pickup_lng,
    dropoff_lat,
    dropoff_lng,
    created_at,
    type = 'ride',
    status = 'pending',
}: JobCardProps) {
    const [distance, setDistance] = useState<number | null>(null);
    const [pickupAddr, setPickupAddr] = useState<string | null>('Loading address…');
    const [dropoffAddr, setDropoffAddr] = useState<string | null>(
        dropoff_lat != null && dropoff_lng != null ? 'Loading address…' : null
    );

    const calculateDistance = (
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number
    ) => {
        const R = 6371;
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                ({ coords }) => {
                    const d = calculateDistance(
                        coords.latitude,
                        coords.longitude,
                        pickup_lat,
                        pickup_lng
                    );
                    setDistance(d);
                },
                () => { }
            );
        }
    }, [pickup_lat, pickup_lng]);

    useEffect(() => {
        async function fetchAddress(lat: number, lon: number, setter: (s: string) => void) {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reverse-geocode?lat=${lat}&lon=${lon}`);
                const data = await res.json();
                if (!data || !data.display_name) {
                    throw new Error('No address found');
                }
                setter(data.display_name as string);
            } catch {
                setter(`${Number(lat).toFixed(5)}, ${Number(lon).toFixed(5)}`);
            }
        }

        fetchAddress(pickup_lat, pickup_lng, setPickupAddr);
        if (dropoff_lat != null && dropoff_lng != null) {
            fetchAddress(dropoff_lat, dropoff_lng, setDropoffAddr);
        }
    }, [pickup_lat, pickup_lng, dropoff_lat, dropoff_lng]);

    const timeAgo = () => {
        if (!created_at) return null;
        const seconds = Math.floor((Date.now() - new Date(created_at).getTime()) / 1000);
        if (seconds < 60) return `${seconds}s ago`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    const Icon = type === 'delivery' ? TruckIcon : AcademicCapIcon;

    const StatusPill = () => {
        const base =
            'text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap';
        switch (status) {
            case 'pending':
                return <span className={`${base} bg-yellow-100 text-yellow-700`}>Pending</span>;
            case 'assigned':
                return <span className={`${base} bg-blue-100 text-blue-700`}>Assigned</span>;
            case 'completed':
                return <span className={`${base} bg-green-100 text-green-700`}>Completed</span>;
            default:
                return null;
        }
    };

    return (
        <div className="p-4 bg-white border border-zinc-200 rounded-lg shadow-sm hover:shadow-md transition space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-sm font-semibold text-zinc-700">
                    <Icon className="w-4 h-4" />
                    {type === 'delivery' ? 'Delivery' : 'Ride'} #{id}
                </div>
                <div className="flex gap-2 items-center">
                    {distance !== null && distance < 2 && (
                        <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            Nearby
                        </span>
                    )}
                    <StatusPill />
                </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-zinc-600">
                <MapPinIcon className="w-4 h-4 text-zinc-500" />
                <span className="truncate" title={pickupAddr ?? ''}>
                    {pickupAddr ?? `(${Number(pickup_lat).toFixed(5)}, ${Number(pickup_lng).toFixed(5)})`}
                </span>
                {dropoff_lat !== undefined && dropoff_lng !== undefined && (
                    <>
                        <ArrowRightIcon className="w-4 h-4 text-zinc-400" />
                        <span className="truncate" title={dropoffAddr ?? ''}>
                            {dropoffAddr ?? `(${Number(dropoff_lat).toFixed(5)}, ${Number(dropoff_lng).toFixed(5)})`}
                        </span>
                    </>
                )}
            </div>

            {distance !== null && (
                <p className="text-xs text-zinc-500">
                    Estimated distance to pickup: {distance.toFixed(2)} km
                </p>
            )}

            {created_at && (
                <div className="flex items-center gap-1 text-xs text-zinc-400">
                    <ClockIcon className="w-4 h-4" />
                    <span>{timeAgo()}</span>
                </div>
            )}

            <Link
                href={`/dashboard/requests/${id}`}
                className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline mt-2"
            >
                View & Accept <ArrowTopRightOnSquareIcon className="w-4 h-4" />
            </Link>
        </div>
    );
}
