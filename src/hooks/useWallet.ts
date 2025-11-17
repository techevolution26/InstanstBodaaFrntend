// src/hooks/useWallet.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosResponse } from 'axios';
import api from '@/services/api';
import type { TransactionsResponse, WalletOverview } from '@/types';

type ModifySavingsInput = {
  amount: number;
  type: 'deposit' | 'withdraw';
};

export function useWallet() {
  return useQuery<WalletOverview, Error>({
    queryKey: ['wallet'],
    queryFn: () => api.get('/api/wallet').then(r => r.data as WalletOverview),
    staleTime: 1000 * 30,
  });
}

export function useTransactions(page = 1) {
  // typed to the canonical TransactionsResponse from src/types.ts
  return useQuery<TransactionsResponse, Error>({
    queryKey: ['wallet', 'txs', page],
    queryFn: () =>
      api
        .get<TransactionsResponse>('/api/wallet/transactions', { params: { page } })
        .then(r => r.data),
    // NOTE: omitted keepPreviousData to avoid mismatches between react-query v4/v5 typings.
    // If you need the behavior:
    // - v4: add `keepPreviousData: true`
    // - v5: add `placeholderData: keepPreviousData` and import keepPreviousData
    staleTime: 1000 * 60 * 5,
  });
}

/* Mutations use AxiosResponse<unknown> to satisfy the linter.
   Replace 'unknown' with a concrete interface if you know the API response shape.
*/

export function useModifySavings() {
  const qc = useQueryClient();
  return useMutation<AxiosResponse<unknown>, Error, ModifySavingsInput>({
    mutationFn: (data) => api.post('/api/wallet/savings', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wallet', 'txs'] });
      qc.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
}

export function useRequestLoan() {
  const qc = useQueryClient();
  return useMutation<AxiosResponse<unknown>, Error, { amount: number }>({
    mutationFn: (data) => api.post('/api/wallet/loan', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wallet', 'txs'] });
      qc.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
}

export function useRepayLoan() {
  const qc = useQueryClient();
  return useMutation<AxiosResponse<unknown>, Error, { amount: number }>({
    mutationFn: (data) => api.post('/api/wallet/loan/repay', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wallet', 'txs'] });
      qc.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
}
