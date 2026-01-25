import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { analyticsAPI, pricesAPI, healthCheck, appStatus } from '../services/api';

// Health check hook to verify backend is ready
export const useHealthCheck = () => {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => healthCheck().then(res => res.data),
    retry: 10,
    retryDelay: (attemptIndex) => Math.min(1000 * (attemptIndex + 1), 5000),
    staleTime: 30 * 1000,
  });
};

// App status hook to track loading state
export const useAppStatus = (options = {}) => {
  return useQuery({
    queryKey: ['appStatus'],
    queryFn: () => appStatus().then(res => res.data),
    refetchInterval: (query) => {
      // Poll every second while loading, stop when ready
      const data = query.state.data;
      return data?.ready ? false : 1000;
    },
    retry: 3,
    retryDelay: 500,
    staleTime: 0, // Always fetch fresh status
    ...options,
  });
};

export const usePortfolioSummary = () => {
  return useQuery({
    queryKey: ['portfolio', 'summary'],
    queryFn: () => analyticsAPI.getPortfolioSummary().then(res => res.data),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    retry: 5,
    retryDelay: (attemptIndex) => Math.min(2000 * (attemptIndex + 1), 10000),
  });
};

export const useAllocation = () => {
  return useQuery({
    queryKey: ['portfolio', 'allocation'],
    queryFn: () => analyticsAPI.getAllocation().then(res => res.data),
    retry: 5,
    retryDelay: (attemptIndex) => Math.min(2000 * (attemptIndex + 1), 10000),
  });
};

export const usePerformance = () => {
  return useQuery({
    queryKey: ['portfolio', 'performance'],
    queryFn: () => analyticsAPI.getPerformance().then(res => res.data),
    retry: 5,
    retryDelay: (attemptIndex) => Math.min(2000 * (attemptIndex + 1), 10000),
  });
};

export const useCurrentPrices = () => {
  return useQuery({
    queryKey: ['prices', 'current'],
    queryFn: () => pricesAPI.getCurrent().then(res => res.data),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    retry: 5,
    retryDelay: (attemptIndex) => Math.min(2000 * (attemptIndex + 1), 10000),
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
