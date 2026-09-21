import { useState, useCallback } from 'react';

export interface Toast {
  id: string;
  variant: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
}

export const useToasts = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(
    (
      variant: Toast['variant'],
      title: string,
      description?: string
    ) => {
      const newToast: Toast = {
        id: Date.now().toString() + Math.random(),
        variant,
        title,
        description,
      };

      // Prevent duplicate toasts
      setToasts((prev) => {
        const isDuplicate = prev.some(
          (t) => t.title === title && t.description === description
        );
        if (isDuplicate) return prev;
        return [...prev, newToast];
      });
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    addToast,
    removeToast,
    clearAll,
  };
};
