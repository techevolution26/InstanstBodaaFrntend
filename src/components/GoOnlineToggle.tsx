// src/components/GoOnlineToggle.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import api from '@/services/api';

export default function GoOnlineToggle() {
  const [online, setOnline] = useState(false);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<number | null>(null);

  // Send the current coords + online flag to the API
  const sendLocation = async (isOnline: boolean) => {
    if (!navigator.geolocation) {
      alert('Geolocation not supported');
      return;
    }

    return new Promise<void>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            await api.post('/api/provider/location', {
              latitude:  pos.coords.latitude,
              longitude: pos.coords.longitude,
              online:    isOnline,
            });
            resolve();
          } catch (e) {
            console.error('Failed to send location', e);
            reject(e);
          }
        },
        (err) => {
          console.error('Geolocation error', err);
          alert('Unable to get location: ' + err.message);
          reject(err);
        }
      );
    });
  };

  // Called when user clicks the button
  const toggle = async () => {
    setLoading(true);
    try {
      await sendLocation(!online);
      setOnline((o) => !o);
    } catch {
      alert('Failed to update online status');
    } finally {
      setLoading(false);
    }
  };

  // When `online` flips to true, start a 30s interval to resend location;
  // when it flips to false, clear it and inform server
  useEffect(() => {
    if (online) {
      // send immediately (in case toggle didn't wait for recalc)
      sendLocation(true).catch(() => {});
      // then every 30s
      intervalRef.current = window.setInterval(() => {
        sendLocation(true).catch(() => {});
      }, 30_000);
    } else {
      // if going offline, notify server once
      sendLocation(false).catch(() => {});
      // clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [online]);

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`px-4 py-2 rounded ${
        online ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
      }`}
    >
      {loading
        ? 'Updating…'
        : online
        ? 'Go Offline'
        : 'Go Online (Share Location)'}
    </button>
  );
}
