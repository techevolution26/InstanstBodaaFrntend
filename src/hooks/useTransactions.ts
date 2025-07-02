import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { TransactionsResponse } from '@/types';

export function useTransactions(page = 1) {
  return useQuery<TransactionsResponse, Error>({
    queryKey: ['wallet','txs', page],
    queryFn: () =>
      api
        .get<TransactionsResponse>('/api/wallet/transactions', { params: { page } })
        .then(r => r.data),
    keepPreviousData: true,
    // optionally:
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
