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
import type { Transaction as TTransaction } from '@/types';

function formatAmount(amount: unknown): string {
  const n = Number(amount);
  return Number.isFinite(n)
    ? `${n < 0 ? '-' : '+'}KES ${Math.abs(n).toFixed(2)}`
    : 'KES 0.00';
}

export default function WalletPage() {
  // Balances
  const { data: overview, isLoading: isWalletLoading } = useWallet();

  // Transactions (paginated)
  const {
    data: txsResponse,
    isLoading: isTxLoading,
    isError: isTxError,
  } = useTransactions();

  // unwrap the `data` array safely (TransactionsResponse.data is an array per your src/types.ts)
  const transactions: TTransaction[] = txsResponse?.data ?? [];
  const latestFive = transactions.slice(0, 5);

  // Mutations (we use mutateAsync with local loading flags in this file)
  const modSavings = useModifySavings();
  const reqLoan = useRequestLoan();
  const repayLoan = useRepayLoan();

  // local form state
  const [savingsAmt, setSavingsAmt] = useState<number>(0);
  const [loanAmt, setLoanAmt] = useState<number>(0);

  // local loading flags (we use mutateAsync + local flags instead of relying on mutation.isLoading)
  const [isModSavingsLoading, setIsModSavingsLoading] = useState(false);
  const [isReqLoanLoading, setIsReqLoanLoading] = useState(false);
  const [isRepayLoanLoading, setIsRepayLoanLoading] = useState(false);

  if (isWalletLoading || !overview) {
    return <p>Loading wallet…</p>;
  }

  // coerce balances to numbers for formatting/comparison
  const balanceNum = Number(overview.balance ?? 0);
  const savingsNum = Number(overview.savings_balance ?? 0);
  const loanNum = Number(overview.loan_balance ?? 0);

  // handlers using mutateAsync
  const handleDepositSavings = async () => {
    setIsModSavingsLoading(true);
    try {
      await modSavings.mutateAsync({ amount: savingsAmt, type: 'deposit' });
    } catch (e) {
      console.error(e);
    } finally {
      setIsModSavingsLoading(false);
    }
  };

  const handleWithdrawSavings = async () => {
    setIsModSavingsLoading(true);
    try {
      await modSavings.mutateAsync({ amount: savingsAmt, type: 'withdraw' });
    } catch (e) {
      console.error(e);
    } finally {
      setIsModSavingsLoading(false);
    }
  };

  const handleRequestLoan = async () => {
    setIsReqLoanLoading(true);
    try {
      await reqLoan.mutateAsync({ amount: loanAmt });
    } catch (e) {
      console.error(e);
    } finally {
      setIsReqLoanLoading(false);
    }
  };

  const handleRepayLoan = async () => {
    setIsRepayLoanLoading(true);
    try {
      await repayLoan.mutateAsync({ amount: loanAmt });
    } catch (e) {
      console.error(e);
    } finally {
      setIsRepayLoanLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      {/* Balances */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded shadow text-center">
          <p className="text-sm text-gray-500">Wallet</p>
          <p className="text-2xl font-semibold">
            KES {Number.isFinite(balanceNum) ? balanceNum.toFixed(2) : '0.00'}
          </p>
        </div>

        <div className="p-4 bg-white rounded shadow text-center">
          <p className="text-sm text-gray-500">Savings</p>
          <p className="text-2xl font-semibold">
            KES {Number.isFinite(savingsNum) ? savingsNum.toFixed(2) : '0.00'}
          </p>
        </div>

        <div className="p-4 bg-white rounded shadow text-center">
          <p className="text-sm text-gray-500">Loan</p>
          <p className="text-2xl font-semibold text-red-600">
            -KES {Number.isFinite(loanNum) ? loanNum.toFixed(2) : '0.00'}
          </p>
        </div>
      </div>

      {/* Actions */}
      <WalletFundForm />
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
              onClick={handleDepositSavings}
              disabled={isModSavingsLoading}
              className="flex-1 py-2 bg-green-600 text-white rounded disabled:opacity-50"
            >
              {isModSavingsLoading ? 'Processing…' : 'Deposit Savings'}
            </button>
            <button
              onClick={handleWithdrawSavings}
              disabled={isModSavingsLoading}
              className="flex-1 py-2 bg-yellow-600 text-white rounded disabled:opacity-50"
            >
              {isModSavingsLoading ? 'Processing…' : 'Withdraw Savings'}
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
              onClick={handleRequestLoan}
              disabled={isReqLoanLoading}
              className="flex-1 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
            >
              {isReqLoanLoading ? 'Requesting…' : 'Request Loan'}
            </button>

            {loanNum > 0 && (
              <button
                onClick={handleRepayLoan}
                disabled={isRepayLoanLoading}
                className="flex-1 py-2 bg-red-600 text-white rounded disabled:opacity-50"
              >
                {isRepayLoanLoading ? 'Repaying…' : 'Repay Loan'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded shadow p-4">
        <h2 className="font-semibold mb-2">Transactions</h2>

        {isTxLoading && <p className="text-sm text-gray-500">Loading transactions…</p>}
        {isTxError && <p className="text-sm text-red-600">Failed to load transactions.</p>}
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
