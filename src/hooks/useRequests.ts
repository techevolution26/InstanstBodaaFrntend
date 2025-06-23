// src/hooks/useRequests.ts
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

export function useRequests() {
  return useQuery({
    queryKey: ['requests'],
    queryFn: () => api.get('/api/requests').then(res => res.data),
  });
}
