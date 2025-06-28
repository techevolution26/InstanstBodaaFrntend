'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet’s default icon URLs (for SSR-compatible rendering)
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

type MapPickerProps = {
  position: [number, number];
  setPosition: (pos: [number, number]) => void;
  label: string;
};

export default function MapPicker({
  position,
  setPosition,
  label,
}: MapPickerProps) {
  const [address, setAddress] = useState<string>(
    `(${position[0].toFixed(5)}, ${position[1].toFixed(5)})`
  );

  // fetch helper
  const fetchAddress = async (lat: number, lon: number) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/reverse-geocode?lat=${lat}&lon=${lon}`
      );
      const data = await res.json();
      if (res.ok && data.display_name) {
        setAddress(data.display_name);
        return;
      }
    } catch {
      // ignore, fallback to coords
    }
    setAddress(`(${lat.toFixed(5)}, ${lon.toFixed(5)})`);
  };

  // whenever position changes, re-fetch
  useEffect(() => {
    fetchAddress(position[0], position[1]);
  }, [position[0], position[1]]);

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

  return (
    <div className="w-full bg-white rounded-md border border-zinc-200 shadow-sm overflow-hidden mb-6">
      <div className="px-4 pt-4">
        <label className="block text-sm font-medium text-zinc-700 mb-1">
          {label}
        </label>
      </div>
      <div
        className="relative"
        style={{ height: '300px', minHeight: '200px' }}
      >
        <MapContainer
          center={position}
          zoom={13}
          scrollWheelZoom={true}
          className="absolute inset-0"
          style={{ height: '100%', width: '100%', borderRadius: '0.375rem' }}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker />
        </MapContainer>
      </div>
      <div className="px-4 py-3 border-t bg-zinc-50">
        <p className="text-sm text-zinc-600 font-mono">
          {address}
        </p>
      </div>
    </div>
  );
}
