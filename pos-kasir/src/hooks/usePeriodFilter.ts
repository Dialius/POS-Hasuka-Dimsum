import { useState } from 'react';

export type Period = 'today' | '7days' | 'month' | 'custom';

export const usePeriodFilter = (initialPeriod: Period = 'today') => {
  const [period, setPeriod] = useState<Period>(initialPeriod);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const setCustomPeriod = (start: Date, end: Date) => {
    setPeriod('custom');
    setStartDate(start);
    setEndDate(end);
  };

  const resetToToday = () => {
    setPeriod('today');
    setStartDate(null);
    setEndDate(null);
  };

  const getDateRange = (): { start: Date; end: Date } => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (period) {
      case 'today':
        return { start: today, end: now };
      
      case '7days':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return { start: weekAgo, end: now };
      
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return { start: monthAgo, end: now };
      
      case 'custom':
        return {
          start: startDate || today,
          end: endDate || now,
        };
      
      default:
        return { start: today, end: now };
    }
  };

  return {
    period,
    setPeriod,
    startDate,
    endDate,
    setCustomPeriod,
    resetToToday,
    getDateRange,
  };
};
