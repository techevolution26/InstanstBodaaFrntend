'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useCreateRequest } from '@/hooks/useCreateRequest';
import { useReverseGeocode } from '@/hooks/useReverseGeocode';
import Modal from '@/components/Modal';

const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false });

type NearbyItem = {
  id: string;
  name: string;
  category: string;
  lat: number;
  lon: number;
  dist_m: number;
};

type NominatimResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  class?: string;
  type?: string;
  boundingbox?: [string, string, string, string];
};

function haversineDistanceKm(a: [number, number], b: [number, number]) {
  const [lat1, lon1] = a.map(Number);
  const [lat2, lon2] = b.map(Number);
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * c;
}

/**
 * Autocomplete component (Nominatim)
 * small inline impl — unchanged from your previous file
 */
const NATIVE_GEOCODER_PROXY = false;
const GEOCODER_PROXY_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/geocode`;

function Autocomplete({
  value,
  onChangeValue,
  onSelect,
  placeholder,
  minChars = 3,
  limit = 5,
}: {
  value: string;
  onChangeValue: (v: string) => void;
  onSelect: (item: { lat: number; lon: number; label: string }) => void;
  placeholder?: string;
  minChars?: number;
  limit?: number;
}) {
  const [isOpen, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<NominatimResult[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!value) {
      setItems([]);
      setOpen(false);
      setActiveIndex(-1);
    }
  }, [value]);

  const fetchSuggestions = (q: string) => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }

    if (q.length < minChars) {
      setItems([]);
      setOpen(false);
      return;
    }

    debounceRef.current = window.setTimeout(async () => {
      setLoading(true);
      const ac = new AbortController();
      abortRef.current = ac;

      try {
        let url: string;
        if (NATIVE_GEOCODER_PROXY) {
          const qs = new URLSearchParams({ q, limit: String(limit) });
          url = `${GEOCODER_PROXY_URL}?${qs.toString()}`;
        } else {
          const qs = new URLSearchParams({ q, format: 'json', addressdetails: '0', limit: String(limit) });
          url = `https://nominatim.openstreetmap.org/search?${qs.toString()}`;
        }

        const res = await fetch(url, {
          signal: ac.signal,
          headers: {
            Accept: 'application/json',
            'User-Agent': 'YourAppName/1.0 (contact@yourdomain.example)',
          },
        });

        if (!res.ok) {
          setItems([]);
          setOpen(false);
          setLoading(false);
          return;
        }

        const json = (await res.json()) as NominatimResult[];
        setItems(Array.isArray(json) ? json : []);
        setOpen(true);
        setActiveIndex(-1);
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          /* aborted — ignore */
        } else {
          console.warn('geocode error', err);
        }
        setItems([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  function onInput(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    onChangeValue(v);
    fetchSuggestions(v);
  }

  function pick(item: NominatimResult) {
    const lat = Number(item.lat);
    const lon = Number(item.lon);
    onSelect({ lat, lon, label: item.display_name });
    onChangeValue(item.display_name);
    setOpen(false);
    setItems([]);
    setActiveIndex(-1);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && items[activeIndex]) {
        pick(items[activeIndex]);
      } else {
        setOpen(false);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        value={value}
        onChange={onInput}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className="w-full border border-zinc-300 rounded px-3 py-2 text-sm"
        aria-autocomplete="list"
      />
      {loading && <div className="absolute right-2 top-2 text-xs text-zinc-500">…</div>}

      {isOpen && items.length > 0 && (
        <ul role="listbox" className="absolute z-50 mt-1 w-full bg-white border border-zinc-200 rounded shadow-sm max-h-56 overflow-auto">
          {items.map((it, idx) => (
            <li
              key={`${it.place_id}_${idx}`}
              role="option"
              aria-selected={idx === activeIndex}
              onMouseDown={(ev) => {
                ev.preventDefault();
                pick(it);
              }}
              onMouseEnter={() => setActiveIndex(idx)}
              className={`px-3 py-2 text-sm cursor-pointer ${idx === activeIndex ? 'bg-zinc-100' : 'hover:bg-zinc-50'}`}
            >
              <div className="truncate">{it.display_name}</div>
            </li>
          ))}
        </ul>
      )}

      {isOpen && !loading && items.length === 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-zinc-200 rounded shadow-sm px-3 py-2 text-sm text-zinc-500">
          No suggestions
        </div>
      )}
    </div>
  );
}

export default function CreateRidePage() {
  const mutate = useCreateRequest();
  const router = useRouter();

  const [pickup, setPickup] = useState<[number, number]>([-1.2921, 36.8219]);
  const [dropoff, setDropoff] = useState<[number, number]>([-1.2921, 36.8319]);
  const [type, setType] = useState<'ride' | 'delivery'>('ride');
  const [error, setError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [searchPickup, setSearchPickup] = useState('');
  const [searchDropoff, setSearchDropoff] = useState('');
  const [nearby, setNearby] = useState<NearbyItem[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);

  // reverse geocode hook for pretty names
  const pickupGeo = useReverseGeocode(pickup[0], pickup[1]);
  const dropoffGeo = useReverseGeocode(dropoff[0], dropoff[1]);

  const distanceKm = useMemo(() => haversineDistanceKm(pickup, dropoff), [pickup, dropoff]);
  const etaMinutes = Math.max(3, Math.round((distanceKm / 35) * 60)); // assume avg 35 km/h
  const fareEstimate = Math.max(1, Math.round(distanceKm * 0.6 * 100) / 100); // placeholder formula

  async function onSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
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
      const maybe = err as { response?: { data?: { message?: string } } };
      if (maybe?.response?.data?.message) message = maybe.response.data.message;
      setError(message);
      toast.error(message);
    }
  }

  // Auto-fill pickup from localStorage or geolocation on mount
  useEffect(() => {
    const saved = localStorage.getItem('last_pickup');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as [number, number];
        if (Array.isArray(parsed) && parsed.length === 2) {
          setPickup(parsed);
          return;
        }
      } catch {
        /* ignore */
      }
    }

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPickup([pos.coords.latitude, pos.coords.longitude]);
          localStorage.setItem('last_pickup', JSON.stringify([pos.coords.latitude, pos.coords.longitude]));
        },
        () => {
          // silent fail
        },
        { maximumAge: 60 * 1000, timeout: 5000, enableHighAccuracy: true }
      );
    }
  }, []);

  // When pickup changes, fetch nearby POIs (debounced)
  useEffect(() => {
    const id = window.setTimeout(() => {
      fetchNearby(pickup[0], pickup[1], 1500);
    }, 350);
    return () => window.clearTimeout(id);
  }, [pickup[0], pickup[1]]);

  async function fetchNearby(lat: number, lon: number, radius = 1500) {
    setNearbyLoading(true);
    try {
      const qs = new URLSearchParams({ lat: String(lat), lon: String(lon), radius: String(radius), types: 'hotel,hospital,marketplace,supermarket,restaurant,pharmacy' });
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/nearby?${qs.toString()}`, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('Nearby fetch failed');
      const json = await res.json();
      setNearby(Array.isArray(json.items) ? json.items : []);
    } catch (e) {
      console.warn('Nearby fetch failed', e);
      setNearby([]);
    } finally {
      setNearbyLoading(false);
    }
  }

  // current location button
  const useCurrentLocation = () => {
    if (!('geolocation' in navigator)) {
      toast.error('Geolocation not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setPickup(coords);
        localStorage.setItem('last_pickup', JSON.stringify(coords));
        toast.success('Using current location');
      },
      () => {
        toast.error('Unable to get current location');
      },
      { enableHighAccuracy: true }
    );
  };

  const swap = () => {
    const p = pickup;
    setPickup(dropoff);
    setDropoff(p);
  };

  const readyToSubmit = Boolean(pickup && dropoff && (type === 'ride' || (type === 'delivery' && dropoff)));

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-zinc-800">Request a Ride / Delivery</h1>
      {error && <p className="text-sm text-red-600 border border-red-200 bg-red-50 px-3 py-2 rounded">{error}</p>}

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="flex gap-3 items-center">
          <label className="flex-1">
            <div className="text-sm font-medium text-zinc-700 mb-1">Request Type</div>
            <select value={type} onChange={(e) => setType(e.target.value as 'ride' | 'delivery')} className="w-full border border-zinc-300 rounded px-3 py-2 bg-white text-sm shadow-sm">
              <option value="ride">Ride</option>
              <option value="delivery">Delivery</option>
            </select>
          </label>

          <div className="flex flex-col gap-2">
            <button type="button" onClick={useCurrentLocation} className="px-3 py-2 text-sm bg-zinc-100 rounded">Use My Location</button>
            <button type="button" onClick={swap} className="px-3 py-2 text-sm bg-zinc-100 rounded">Swap</button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <label>
            <div className="text-sm font-medium text-zinc-700 mb-1">Pickup (search or drop pin)</div>
            <Autocomplete
              value={searchPickup}
              onChangeValue={(v) => setSearchPickup(v)}
              onSelect={({ lat, lon, label }) => {
                setPickup([lat, lon]);
                setSearchPickup(label);
              }}
              placeholder="Start typing an address (optional)"
            />
          </label>

          <label>
            <div className="text-sm font-medium text-zinc-700 mb-1">Drop-off (search or drop pin)</div>
            <Autocomplete
              value={searchDropoff}
              onChangeValue={(v) => setSearchDropoff(v)}
              onSelect={({ lat, lon, label }) => {
                setDropoff([lat, lon]);
                setSearchDropoff(label);
              }}
              placeholder="Address or leave for pickup-only"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-1">
          <MapPicker label="Pickup Location" position={pickup} setPosition={(p) => { setPickup(p); setSearchPickup(''); }} />
          <MapPicker label="Drop-off Location" position={dropoff} setPosition={(p) => { setDropoff(p); setSearchDropoff(''); }} />
        </div>

        {/* Nearby suggestions */}
        <div className="border rounded p-3 bg-white">
          <div className="flex items-center justify-between mb-2">
            <strong>Nearby suggestions</strong>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => fetchNearby(pickup[0], pickup[1], 1500)} className="text-xs px-2 py-1 bg-zinc-100 rounded">Refresh</button>
            </div>
          </div>

          {nearbyLoading ? <p className="text-sm text-zinc-500">Searching nearby…</p> : null}

          {!nearbyLoading && nearby.length === 0 ? (
            <p className="text-sm text-zinc-500">No nearby suggestions found.</p>
          ) : (
            <div className="grid gap-2">
              {nearby.map(item => (
                <button key={item.id} type="button" onClick={() => { setDropoff([item.lat, item.lon]); setSearchDropoff(item.name); }} className="text-left p-2 rounded hover:bg-zinc-50">
                  <div className="text-sm font-medium">{item.name}</div>
                  <div className="text-xs text-zinc-500">{item.category} • {(item.dist_m / 1000).toFixed(2)} km</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border rounded p-4 bg-white flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-700">
              <strong>From:</strong>{' '}
              <span title={pickupGeo.result?.display_name ?? ''}>
                {pickupGeo.loading ? 'Searching…' : pickupGeo.result?.display_name ?? `(${pickup[0].toFixed(5)}, ${pickup[1].toFixed(5)})`}
              </span>
            </p>
            <p className="text-sm text-zinc-700 mt-1">
              <strong>To:</strong>{' '}
              <span title={dropoffGeo.result?.display_name ?? ''}>
                {dropoffGeo.loading ? 'Searching…' : dropoffGeo.result?.display_name ?? `(${dropoff[0].toFixed(5)}, ${dropoff[1].toFixed(5)})`}
              </span>
            </p>
          </div>

          <div className="text-right">
            <p className="text-sm text-zinc-600">Distance: <strong>{distanceKm.toFixed(2)} km</strong></p>
            <p className="text-sm text-zinc-600">ETA: <strong>{etaMinutes} min</strong></p>
            <p className="text-sm text-zinc-600">Est. fare: <strong>KES {fareEstimate.toFixed(2)}</strong></p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={!readyToSubmit || mutate.status === 'pending'}
            className="flex-1 px-4 py-2 text-white bg-zinc-700 rounded hover:bg-zinc-800 disabled:opacity-50"
          >
            {mutate.status === 'pending' ? 'Requesting…' : `Confirm ${type === 'ride' ? 'Ride' : 'Delivery'}`}
          </button>

          <button type="button" onClick={() => { setPickup([-1.2921, 36.8219]); setDropoff([-1.2921, 36.8319]); setSearchPickup(''); setSearchDropoff(''); }} className="px-4 py-2 border rounded">Reset</button>
        </div>
      </form>

      {/* Confirm modal (uses reusable Modal component) */}
      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Confirm request">
        <p className="text-sm mb-2">
          From: {pickupGeo.result?.display_name ?? `(${pickup[0].toFixed(5)}, ${pickup[1].toFixed(5)})`}
        </p>
        <p className="text-sm mb-2">
          To: {dropoffGeo.result?.display_name ?? `(${dropoff[0].toFixed(5)}, ${dropoff[1].toFixed(5)})`}
        </p>
        <p className="text-sm mb-4">ETA: {etaMinutes} min • Est. fare: KES {fareEstimate.toFixed(2)}</p>
        <div className="flex justify-end gap-2">
          <button onClick={() => setConfirmOpen(false)} className="px-4 py-2 border rounded">Cancel</button>
          <button onClick={async () => { setConfirmOpen(false); await onSubmit(); }} className="px-4 py-2 bg-blue-600 text-white rounded">Confirm</button>
        </div>
      </Modal>
    </div>
  );
}
