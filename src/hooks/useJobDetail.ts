// hooks/useJobDetail.ts
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

export function useJobDetail(id: string | number) {
  return useQuery({
    queryKey: ['jobDetail', id],
    queryFn: () =>
      api.get(`/api/requests/${id}`).then(res => res.data),
    enabled: !!id, // only run if ID is present
  });
}
