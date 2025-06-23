// src/hooks/usePendingRequests.ts
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

export function usePendingRequests() {
  return useQuery({
    queryKey: ['pendingRequests'],
    queryFn: () => api.get('/api/requests?status=pending').then(res => res.data),
  });
}
