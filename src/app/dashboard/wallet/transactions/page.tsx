// src/app/dashboard/wallet/transactions/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTransactions } from '@/hooks/useWallet';
import Link from 'next/link';
import { Transaction } from '@/types';

function formatAmount(amount: unknown): string {
  const n = Number(amount);
  return Number.isFinite(n)
    ? `${n < 0 ? '-' : '+'}KES ${Math.abs(n).toFixed(2)}`
    : 'KES 0.00';
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(iso));
}

function groupByDate(transactions: Transaction[]) {
  return transactions.reduce<Record<string, Transaction[]>>((acc, tx) => {
    const dateKey = formatDate(tx.created_at);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(tx);
    return acc;
  }, {});
}

const ALL_TYPES = ['all', 'deposit', 'withdraw', 'loan_disbursement', 'loan_repayment'];

export default function TransactionsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialPage = Number(searchParams.get('page') ?? '1');
  const selectedType = searchParams.get('type') ?? 'all';

  const [page, setPage] = useState(initialPage);
  const [filterType, setFilterType] = useState(selectedType);

  useEffect(() => {
    const qp = Number(searchParams.get('page') ?? '1');
    if (!Number.isNaN(qp) && qp !== page) {
      setPage(qp);
    }

    const type = searchParams.get('type') ?? 'all';
    if (type !== filterType) {
      setFilterType(type);
    }
  }, [searchParams]);

  const {
    data: txsResponse,
    isLoading,
    isError,
  } = useTransactions(page);

  const allTransactions: Transaction[] = txsResponse?.data ?? [];
  const filteredTransactions =
    filterType === 'all'
      ? allTransactions
      : allTransactions.filter((tx) => tx.type === filterType);

  const grouped = groupByDate(filteredTransactions);
  const meta = txsResponse?.meta;

  function goTo(newPage: number, type: string = filterType) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(newPage));
    params.set('type', type);
    setPage(newPage);
    setFilterType(type);
    router.push(`/dashboard/wallet/transactions?${params.toString()}`, { scroll: true });
  }

  function handleFilterChange(e: React.ChangeEvent<HTMLSelectElement>) {
    goTo(1, e.target.value);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transaction History</h1>
        <select
          value={filterType}
          onChange={handleFilterChange}
          className="border rounded px-2 py-1 text-sm"
        >
          {ALL_TYPES.map((type) => (
            <option key={type} value={type}>
              {type === 'all' ? 'All Types' : type.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <p className="text-gray-500">Loading…</p>}
      {isError && <p className="text-red-600">Failed to load.</p>}

      {!isLoading && !isError && filteredTransactions.length === 0 && (
        <p className="text-gray-500">No transactions found.</p>
      )}

      {!isLoading && !isError && filteredTransactions.length > 0 && (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, txs]) => (
            <div key={date}>
              <h2 className="text-sm font-semibold text-gray-500 mb-2">{date}</h2>
              <ul className="space-y-2">
                {txs.map((tx) => (
                  <li
                    key={tx.id}
                    className="flex justify-between bg-white p-3 rounded shadow-sm"
                  >
                    <span className="text-sm">
                      {formatTime(tx.created_at)} –{' '}
                      <strong className="capitalize">{tx.type.replace(/_/g, ' ')}</strong>
                    </span>
                    <span
                      className={tx.amount < 0 ? 'text-red-600' : 'text-green-600'}
                    >
                      {formatAmount(tx.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {meta && (
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => goTo(page - 1)}
            disabled={isLoading || page <= 1}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            ← Previous
          </button>

          <span className="text-sm text-gray-600">
            Page {meta.current_page} of {meta.last_page}
          </span>

          <button
            onClick={() => goTo(page + 1)}
            disabled={isLoading || page >= meta.last_page}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Next →
          </button>
        </div>
      )}

      <Link
        href="/dashboard/wallet"
        className="inline-block mt-6 text-indigo-600 hover:underline text-sm"
      >
        ← Back to Wallet
      </Link>
    </div>
  );
}
