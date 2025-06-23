// src/hooks/useUpdateRequest.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export function useUpdateRequest() {
  const qc = useQueryClient();
  return useMutation<
    unknown, // Replace 'unknown' with the actual response type if known
    Error,
    { id: number; status: string }
  >({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.patch(`/api/requests/${id}`, { status }).then(res => res.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pendingRequests'] });
      qc.invalidateQueries({ queryKey: ['requests'] });
    },
  });
}
