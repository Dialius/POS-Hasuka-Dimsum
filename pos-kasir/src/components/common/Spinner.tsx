import React from 'react';

type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type SpinnerVariant = 'primary' | 'white' | 'secondary';

interface SpinnerProps {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  className?: string;
}

const sizeMap: Record<SpinnerSize, string> = {
  xs: 'w-3 h-3 border-2',
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-3',
  lg: 'w-8 h-8 border-4',
  xl: 'w-14 h-14 border-4',
};

const variantMap: Record<SpinnerVariant, string> = {
  primary: 'border-amber-700/30 border-t-amber-700',
  white: 'border-white/30 border-t-white',
  secondary: 'border-amber-200/30 border-t-amber-400',
};

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  className = '',
}) => {
  return (
    <div
      className={`${sizeMap[size]} ${variantMap[variant]} rounded-full animate-spin ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
};
