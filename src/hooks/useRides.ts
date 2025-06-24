import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

type Ride = {
  id: number;
  status: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_lat: number;
  dropoff_lng: number;
  created_at: string;
};

type RideStatus = 'active' | 'completed' | 'all';

export function useRides(filter: RideStatus = 'active') {
  const query = useQuery({
    queryKey: ['rides', filter],
    queryFn: async (): Promise<Ride[]> => {
      const res = await api.get('/api/requests');
      const all: Ride[] = res.data?.data || [];

      return all.filter((ride) => {
        if (filter === 'all') return true;
        if (filter === 'completed') return ride.status === 'completed';
        return ride.status !== 'completed' && ride.status !== 'cancelled';
      });
    },
  });

  return query;
}
