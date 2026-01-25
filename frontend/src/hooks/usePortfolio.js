import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { analyticsAPI, pricesAPI } from '../services/api';

export const usePortfolioSummary = () => {
  return useQuery({
    queryKey: ['portfolio', 'summary'],
    queryFn: () => analyticsAPI.getPortfolioSummary().then(res => res.data),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};

export const useAllocation = () => {
  return useQuery({
    queryKey: ['portfolio', 'allocation'],
    queryFn: () => analyticsAPI.getAllocation().then(res => res.data),
  });
};

export const usePerformance = () => {
  return useQuery({
    queryKey: ['portfolio', 'performance'],
    queryFn: () => analyticsAPI.getPerformance().then(res => res.data),
  });
};

export const useCurrentPrices = () => {
  return useQuery({
    queryKey: ['prices', 'current'],
    queryFn: () => pricesAPI.getCurrent().then(res => res.data),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};

export const useRefreshPrices = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => pricesAPI.refresh().then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prices'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
    },
  });
};
