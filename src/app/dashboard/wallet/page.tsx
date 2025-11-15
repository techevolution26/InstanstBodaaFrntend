// src/app/dashboard/wallet/page.tsx
'use client';

import { useState } from 'react';
import {
  useWallet,
  useTransactions,
  useModifySavings,
  useRequestLoan,
  useRepayLoan,
} from '@/hooks/useWallet';
import Link from 'next/link';
import WalletFundForm from '@/components/WalletFundForm';

type Transaction = {
  id: number | string;
  type: string;
  amount: number;
  created_at: string;
};

function formatAmount(amount: unknown): string {
  const n = Number(amount);
  return Number.isFinite(n)
    ? `${n < 0 ? '-' : '+'}KES ${Math.abs(n).toFixed(2)}`
    : 'KES 0.00';
}

export default function WalletPage() {
  // Balances
  const { data: overview, isLoading: isWalletLoading } = useWallet();

  //Transactions (paginated)
  const {
    data: txsResponse,
    isLoading: isTxLoading,
    isError: isTxError,
  } = useTransactions();

  // unwrap the `data` array
  const transactions: Transaction[] = txsResponse?.data ?? [];
  const latestFive = transactions.slice(0, 5);

  //Mutations
  const modSavings = useModifySavings();
  const reqLoan = useRequestLoan();
  const repayLoan = useRepayLoan();

  // local form state
  const [savingsAmt, setSavingsAmt] = useState(0);
  const [loanAmt, setLoanAmt] = useState(0);

  if (isWalletLoading || !overview) {
    return <p>Loading wallet…</p>;
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      {/* Balances */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded shadow text-center">
          <p className="text-sm text-gray-500">Wallet</p>
          <p className="text-2xl font-semibold">
            KES {isNaN(Number(overview.balance))
              ? '0.00'
              : Number(overview.balance).toFixed(2)} </p>
        </div>
        <div className="p-4 bg-white rounded shadow text-center">
          <p className="text-sm text-gray-500">Savings</p>
          <p className="text-2xl font-semibold">
            KES {isNaN(Number(overview.savings_balance))
              ? '0.00'
              : Number(overview.savings_balance).toFixed(2)} </p>
        </div>
        <div className="p-4 bg-white rounded shadow text-center">
          <p className="text-sm text-gray-500">Loan</p>
          <p className="text-2xl font-semibold text-red-600">
            -KES {isNaN(Number(overview.loan_balance))
              ? '0.00'
              : Number(overview.loan_balance).toFixed(2)} </p>
        </div>
      </div>

      {/* Actions */}
      <WalletFundForm/>
      <div className="grid grid-cols-2 gap-4">
        {/* Savings deposit/withdraw */}
        <div className="col-span-2 sm:col-span-1 space-y-2">
          <input
            type="number"
            value={savingsAmt}
            onChange={(e) => setSavingsAmt(Number(e.target.value))}
            placeholder="Amount"
            className="w-full border px-2 py-1 rounded"
          />
          <div className="flex gap-2">
            <button
              onClick={() => modSavings.mutate({ amount: savingsAmt, type: 'deposit' })}
              disabled={modSavings.isLoading}
              className="flex-1 py-2 bg-green-600 text-white rounded disabled:opacity-50"
            >
              {modSavings.isLoading ? 'Processing…' : 'Deposit Savings'}
            </button>
            <button
              onClick={() => modSavings.mutate({ amount: savingsAmt, type: 'withdraw' })}
              disabled={modSavings.isLoading}
              className="flex-1 py-2 bg-yellow-600 text-white rounded disabled:opacity-50"
            >
              {modSavings.isLoading ? 'Processing…' : 'Withdraw Savings'}
            </button>
          </div>
        </div>

        {/* Loan request/repay */}
        <div className="col-span-2 sm:col-span-1 space-y-2">
          <input
            type="number"
            value={loanAmt}
            onChange={(e) => setLoanAmt(Number(e.target.value))}
            placeholder="Amount"
            className="w-full border px-2 py-1 rounded"
          />
          <div className="flex gap-2">
            <button
              onClick={() => reqLoan.mutate({ amount: loanAmt })}
              disabled={reqLoan.isLoading}
              className="flex-1 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
            >
              {reqLoan.isLoading ? 'Requesting…' : 'Request Loan'}
            </button>
            {overview.loan_balance > 0 && (
              <button
                onClick={() => repayLoan.mutate({ amount: loanAmt })}
                disabled={repayLoan.isLoading}
                className="flex-1 py-2 bg-red-600 text-white rounded disabled:opacity-50"
              >
                {repayLoan.isLoading ? 'Repaying…' : 'Repay Loan'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded shadow p-4">
        <h2 className="font-semibold mb-2">Transactions</h2>

        {isTxLoading && (
          <p className="text-sm text-gray-500">Loading transactions…</p>
        )}
        {isTxError && (
          <p className="text-sm text-red-600">Failed to load transactions.</p>
        )}
        {!isTxLoading && !isTxError && transactions.length === 0 && (
          <p className="text-sm text-gray-500">No transactions found.</p>
        )}

        {!isTxLoading && !isTxError && latestFive.length > 0 && (
          <ul className="space-y-2">
            {latestFive.map((tx) => (
              <li
                key={tx.id}
                className="flex justify-between text-sm hover:bg-gray-50 p-2 rounded"
              >
                <span>
                  {new Date(tx.created_at).toLocaleDateString()} –{' '}
                  {new Date(tx.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  })}{' '}
                  – <strong className="capitalize">{tx.type.replace(/_/g, ' ')}</strong>
                </span>
                <span className={tx.amount < 0 ? 'text-red-600' : 'text-green-600'}>
                  {formatAmount(tx.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}

        <Link
          href="/dashboard/wallet/transactions"
          className="text-indigo-600 hover:underline text-sm mt-4 block"
        >
          View all transactions →
        </Link>
      </div>
    </div>
  );
}
