// src/app/dashboard/profile/page.tsx
'use client';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';
import api from '@/services/api';

export default function ProfilePage() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [message, setMessage] = useState('');

  async function save() {
    try {
      await api.patch('/api/me', { name, phone });
      setMessage('Profile updated.');
    } catch {
      setMessage('Update failed.');
    }
  }

  return (
    <div>
      <h1 className="text-2xl">Profile</h1>
      {message && <p className="mt-2">{message}</p>}
      <div className="mt-4 space-y-4 max-w-sm">
        <div>
          <label>Name</label>
          <input value={name} onChange={e => setName(e.target.value)} className="w-full" />
        </div>
        <div>
          <label>Phone</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full" />
        </div>
        <button onClick={save} className="mt-2 px-4 py-2 bg-blue-600 text-white">Save</button>
      </div>
    </div>
  );
}
