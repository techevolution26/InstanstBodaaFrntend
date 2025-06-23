// src/components/MapPicker.tsx
'use client';

// import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet’s default icon URLs
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

type MapPickerProps = {
  position: [number, number];
  setPosition: (pos: [number, number]) => void;
  label: string;
};

export default function MapPicker({ position, setPosition, label }: MapPickerProps) {
  // A sub-component to handle click events
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
          dragend(e: L.LeafletEvent) {
            const marker = e.target as L.Marker;
            const latlng = marker.getLatLng();
            setPosition([latlng.lat, latlng.lng]);
          },
        }}
      />
    );
  }

  return (
    <div className="w-full mb-4 bg-white rounded shadow p-4">
      <label className="block text-gray-800 font-semibold mb-2">{label}</label>
      <div className="relative" style={{ height: '300px', minHeight: '200px' }}>
        <MapContainer
          center={position}
          zoom={13}
          className="absolute inset-0 rounded border border-gray-300"
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker />
        </MapContainer>
      </div>
      <p className="mt-3 text-sm text-gray-700 font-mono">
        Lat: <span className="font-bold">{position[0].toFixed(5)}</span>, Lng: <span className="font-bold">{position[1].toFixed(5)}</span>
      </p>
    </div>
  );
}
