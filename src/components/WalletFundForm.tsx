// src/components/WalletFundForm.tsx
'use client';

import { useState } from 'react';
import axios from 'axios';
import api from '@/services/api';
import toast from 'react-hot-toast';

export default function WalletFundForm() {
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  async function onFund() {
    setLoading(true);
    try {
      await api.post('/api/wallet/fund', { phone, amount });
      toast.success('STK Push sent—enter your PIN');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const data = err.response?.data as Record<string, unknown> | undefined;
        const messageFromData =
          data && (typeof data.error === 'string'
            ? data.error
            : typeof data.message === 'string'
              ? data.message
              : undefined);

        toast.error(String(messageFromData ?? err.message));
      } else {
        toast.error(String(err ?? 'Failed to initiate STK Push'));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2 p-4 bg-white rounded shadow">
      <h2 className="font-semibold">Fund via M-PESA</h2>
      <input
        type="text"
        placeholder="Phone (2547XXXXXXXX)"
        value={phone}
        onChange={e => setPhone(e.target.value)}
        className="w-full border px-2 py-1 rounded"
      />
      <input
        type="number"
        placeholder="Amount KES"
        value={amount}
        onChange={e => setAmount(Number(e.target.value))}
        className="w-full border px-2 py-1 rounded"
      />
      <button
        onClick={onFund}
        disabled={loading}
        className="w-full py-2 bg-green-600 text-white rounded disabled:opacity-50"
      >
        {loading ? 'Sending…' : 'Top-Up Wallet'}
      </button>
    </div>
  );
}
