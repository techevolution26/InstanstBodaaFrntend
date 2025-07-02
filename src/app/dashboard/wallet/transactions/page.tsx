// src/app/dashboard/wallet/transactions/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTransactions } from '@/hooks/useWallet';
import Link from 'next/link';
import { Transaction } from '@/types';

export default function TransactionsPage() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const initialPage  = Number(searchParams.get('page') ?? '1');
  const [page, setPage] = useState(initialPage);

  // Whenever URL ?page changes, sync our state
  useEffect(() => {
    const qp = Number(searchParams.get('page') ?? '1');
    if (qp !== page) setPage(qp);
  }, [searchParams, page]);

  // **👇 Here’s the call to your hook:**
  const {
    data: txsResponse,
    isLoading,
    isError,
  } = useTransactions(page);

  // Extract the array and the pagination meta
  const transactions: Transaction[] = txsResponse?.data ?? [];
  const meta = txsResponse?.meta;

  // Navigate + update URL
  function goTo(newPage: number) {
    setPage(newPage);
    router.push(`/dashboard/wallet/transactions?page=${newPage}`, { scroll: true });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-6">
      <h1 className="text-2xl font-bold">Transaction History</h1>

      {isLoading && <p className="text-gray-500">Loading…</p>}
      {isError   && <p className="text-red-600">Failed to load.</p>}

      {!isLoading && !isError && transactions.length === 0 && (
        <p className="text-gray-500">No transactions found.</p>
      )}

      {!isLoading && !isError && transactions.length > 0 && (
        <ul className="space-y-2">
          {transactions.map((tx) => (
            <li key={tx.id} className="flex justify-between bg-white p-3 rounded shadow-sm">
              <span className="text-sm">
                {new Date(tx.created_at).toLocaleDateString()} –{' '}
                <strong className="capitalize">{tx.type.replace(/_/g, ' ')}</strong>
              </span>
              <span className={tx.amount < 0 ? 'text-red-600' : 'text-green-600'}>
                {tx.amount < 0 ? '-' : '+'}${Math.abs(tx.amount).toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* pagination */}
      {meta && (
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => goTo(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            ← Previous
          </button>

          <span className="text-sm text-gray-600">
            Page {meta.current_page} of {meta.last_page}
          </span>

          <button
            onClick={() => goTo(page + 1)}
            disabled={page >= meta.last_page}
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
