import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

type ProviderJob = {
  // Defining the properties of a job here,:
  id: string;
  title: string;
  status: 'incoming' | 'assigned' | 'completed';
  // Adding other fields as needed
};

export function useProviderJobs(
  status: 'incoming' | 'assigned' | 'completed'
) {
  return useQuery<ProviderJob[]>({
    queryKey: ['providerJobs', status],
    queryFn: () =>
      api
        .get('/api/requests', {
          params: { status },
        })
        .then(res => res.data.data as ProviderJob[]),
    // keeping previous while loading new filter
    // keepPreviousData: true,
  });
}
