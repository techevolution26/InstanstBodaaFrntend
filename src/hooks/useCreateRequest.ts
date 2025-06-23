// src/hooks/useCreateRequest.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export function useCreateRequest() {
  const qc = useQueryClient();
interface RequestPayload {
    pickup_lat: number;
    pickup_lng: number;
    dropoff_lat: number;
    dropoff_lng: number;
}

interface RequestResponse {
    pickup_lat: number;
    pickup_lng: number;
    dropoff_lat: number;
    dropoff_lng: number;
}

return useMutation<RequestResponse, Error, RequestPayload>({
    mutationFn: (data: RequestPayload) => api.post<RequestResponse>('/api/requests', data).then(res => res.data),
    onSuccess: () => {
        qc.invalidateQueries({ queryKey: ['requests'] as const });
        qc.invalidateQueries({ queryKey: ['pendingRequests'] as const });
    },
});
}
