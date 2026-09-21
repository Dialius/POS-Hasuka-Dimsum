import { useState, useEffect, useCallback } from 'react';
import { gasApi } from '../services/gasApi';

export interface DashboardData {
  metrics: {
    totalRevenue: number;
    totalTransactions: number;
    avgTransactionValue: number;
    growthRate: number;
  };
  transactions: any[];
  branches: any[];
  cashiers: any[];
  ingredients: any[];
  analytics: {
    categoryDistribution: any[];
    paymentMethods: any[];
    peakHours: any[];
  };
}

export const useDashboardData = (selectedBranch: string = 'all') => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await gasApi.getOwnerDashboardData();
      if (result) {
        setData(result);
        setError(null);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedBranch]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh every 30 seconds (skip when tab is hidden)
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      gasApi.getOwnerDashboardData()
        .then((res) => {
          if (res) setData(res);
        })
        .catch(() => {});
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return {
    data,
    isLoading,
    error,
    refresh: loadData,
  };
};
