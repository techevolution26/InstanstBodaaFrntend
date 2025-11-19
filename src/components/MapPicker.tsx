'use client';

import React from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useReverseGeocode } from '@/hooks/useReverseGeocode';

delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

type MapPickerProps = {
  position: [number, number];
  setPosition: (pos: [number, number]) => void;
  label: string;
};

export default function MapPicker({ position, setPosition, label }: MapPickerProps) {
  const [lat, lon] = position;
  const { loading, result, refresh } = useReverseGeocode(lat, lon, 300);

  function LocationMarker() {
    useMapEvents({
      click(e) {
        setPosition([e.latlng.lat, e.latlng.lng]);
      },
    });

    return (
      <Marker
        position={position}
        draggable={true}
        eventHandlers={{
          dragend(e) {
            const marker = e.target as L.Marker;
            const latlng = marker.getLatLng();
            setPosition([latlng.lat, latlng.lng]);
          },
        }}
      />
    );
  }

  // expose a small UI for refreshing (force) and copying address
  return (
    <div className="w-full bg-white rounded-md border border-zinc-200 shadow-sm overflow-hidden mb-6">
      <div className="px-4 pt-4 flex items-center justify-between">
        <label className="block text-sm font-medium text-zinc-700 mb-1">{label}</label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              refresh(true); // force refresh from server
            }}
            className="text-xs px-2 py-1 bg-zinc-100 rounded"
            aria-label="Refresh address"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(result?.display_name ?? `${lat.toFixed(5)}, ${lon.toFixed(5)}`);
            }}
            className="text-xs px-2 py-1 bg-zinc-100 rounded"
            aria-label="Copy address"
          >
            Copy
          </button>
        </div>
      </div>

      <div className="relative" style={{ height: '300px', minHeight: '200px' }}>
        <MapContainer
          center={position}
          zoom={13}
          scrollWheelZoom
          className="absolute inset-0 z-0"
          style={{ height: '100%', width: '100%', zIndex: 0 }}
        >
          <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <LocationMarker />
        </MapContainer>
      </div>

      <div className="px-4 py-3 border-t bg-zinc-50 flex items-center justify-between">
        <p className="text-sm text-zinc-600 truncate" title={result?.display_name ?? undefined} aria-live="polite">
          {loading ? 'Searching address…' : result?.display_name ?? `(${lat.toFixed(5)}, ${lon.toFixed(5)})`}
        </p>
        {/* dropped cached badge as requested */}
      </div>
    </div>
  );
}
