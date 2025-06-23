// src/hooks/useRides.ts
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

export function useRides() {
  return useQuery({
    queryKey: ['rides'],
    queryFn: () => api.get('/api/requests').then(res => res.data),
  });
}
