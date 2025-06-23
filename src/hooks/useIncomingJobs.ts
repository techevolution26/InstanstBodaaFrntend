// src/hooks/useIncomingJobs.ts
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

type Ride = {
  status: string;
  // Adding other properties as needed
};

export function useIncomingJobs() {
  return useQuery({
    queryKey: ['incomingJobs'],
    queryFn: async () => {
      const res = await api.get('/api/requests');
      // Sanctum/API will return only the provider’s assigned rides
      //endpoint returns all statuses, filter here:
      return res.data.data.filter((r: Ride) => r.status === 'pending');
    },
  });
}
