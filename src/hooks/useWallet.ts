// src/hooks/useWallet.ts
import {
  useQuery,
  useMutation,
  useQueryClient,
  UseMutationResult,
  UseQueryResult,
} from '@tanstack/react-query';
import { AxiosResponse } from 'axios';
import { TransactionsResponse } from '@/types';
import api from '@/services/api';

type ModifySavingsInput = {
  amount: number;
  type: 'deposit' | 'withdraw';
};

export function useWallet(): UseQueryResult<any, Error> {
  return useQuery({
    queryKey: ['wallet'],
    queryFn: () => api.get('/api/wallet').then(r => r.data),
  });
}

export function useTransactions(page = 1): UseQueryResult<TransactionsResponse, Error> {
  return useQuery<TransactionsResponse, Error>({
    queryKey: ['wallet', 'txs', page],
    queryFn: () =>
      api
        .get<TransactionsResponse>('/api/wallet/transactions', { params: { page } })
        .then(r => r.data),
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5,
  });
}

export function useModifySavings(): UseMutationResult<
  AxiosResponse<any>,
  Error,
  ModifySavingsInput
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/api/wallet/savings', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wallet', 'txs'] });
      qc.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
}

export function useRequestLoan(): UseMutationResult<
  AxiosResponse<any>,
  Error,
  { amount: number }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/api/wallet/loan', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wallet', 'txs'] });
      qc.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
}

export function useRepayLoan(): UseMutationResult<
  AxiosResponse<any>,
  Error,
  { amount: number }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/api/wallet/loan/repay', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wallet', 'txs'] });
      qc.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
}
