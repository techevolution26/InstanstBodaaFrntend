'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Switch } from '@headlessui/react';
import { SignalIcon, SignalSlashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/services/api';

export default function GoOnlineToggle() {
  const [online, setOnline] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);

  const updateTime = () => {
    const now = new Date();
    setLastUpdated(now.toLocaleTimeString());
  };

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const { data } = await api.get('/api/me');
        if (data?.online) setOnline(true);
      } catch {
        toast.error('Failed to fetch status');
      }
    };
    fetchStatus();
  }, []);

  const sendLocation = useCallback(async (isOnline: boolean) => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }

    return new Promise<void>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            await api.post('/api/provider/location', {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              online: isOnline,
            });
            updateTime();
            resolve();
          } catch (e) {
            toast.error('Failed to update location');
            reject(e);
          }
        },
        (err) => {
          toast.error('Location error: ' + err.message);
          reject(err);
        }
      );
    });
  }, []);

  const toggle = async () => {
    setLoading(true);
    try {
      await sendLocation(!online);
      setOnline(!online);
      toast.success(!online ? 'You are now online' : 'You are now offline');
    } catch {
      toast.error('Status update failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (online) {
      sendLocation(true).catch(() => { });
      intervalRef.current = window.setInterval(() => {
        sendLocation(true).catch(() => { });
      }, 30_000);
    } else {
      sendLocation(false).catch(() => { });
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [online, sendLocation]);

  return (
    <div className="flex flex-col gap-1 text-sm font-medium text-zinc-800">
      <div className="flex items-center space-x-4">
        <Switch
          checked={online}
          onChange={() => !loading && toggle()}
          className={`${online ? 'bg-zinc-600' : 'bg-zinc-400'} 
            relative inline-flex h-8 w-16 shrink-0 cursor-pointer rounded-full border-2 border-transparent 
            transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 
            focus:ring-zinc-500 disabled:opacity-50`}
        >
          <span
            className={`${online ? 'translate-x-8' : 'translate-x-1'}
              inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-300 ease-in-out`}
          />
        </Switch>
        <div className="flex items-center gap-2">
          {loading ? (
            <svg className="animate-spin w-5 h-5 text-zinc-400" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            </svg>
          ) : online ? (
            <SignalSlashIcon className="w-5 h-5 text-zinc-700" />
          ) : (
            <SignalIcon className="w-5 h-5 text-zinc-500" />
          )}
          {loading ? 'Updating…' : online ? 'Online' : 'Offline'}
        </div>
      </div>

      {lastUpdated && (
        <p className="text-xs text-zinc-500 mt-1">
          Last updated at: {lastUpdated}
        </p>
      )}
    </div>
  );
}
