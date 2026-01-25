/**
 * Custom hook for fetching portfolio history and snapshots
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { snapshotsAPI } from '../services/api';

/**
 * Hook to fetch portfolio history for a given number of days
 */
export const usePortfolioHistory = (days = 30) => {
  return useQuery({
    queryKey: ['portfolio-history', days],
    queryFn: async () => {
      const response = await snapshotsAPI.getHistory(days);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refetch every 5 minutes
  });
};

/**
 * Hook to create a new portfolio snapshot
 */
export const useCreateSnapshot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (snapshotDate = null) => {
      const response = await snapshotsAPI.create(snapshotDate);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch portfolio history queries
      queryClient.invalidateQueries({ queryKey: ['portfolio-history'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-summary'] });
    },
  });
};

/**
 * Hook to get the latest snapshot
 */
export const useLatestSnapshot = () => {
  return useQuery({
    queryKey: ['latest-snapshot'],
    queryFn: async () => {
      const response = await snapshotsAPI.getLatest();
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to backfill historical snapshots
 */
export const useBackfillSnapshots = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ startDate, endDate }) => {
      const response = await snapshotsAPI.backfill(startDate, endDate);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-history'] });
    },
  });
};
