import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface EmptyStateProps {
  icon?: LucideIcon | React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void } | React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  size = 'md',
}) => {
  const isSm = size === 'sm';

  const renderIcon = () => {
    if (!icon) return null;
    if (typeof icon === 'string') {
      return <span className={`mb-3 ${isSm ? 'text-2xl' : 'text-4xl'}`}>{icon}</span>;
    }
    if (React.isValidElement(icon)) {
      return <div className="mb-3">{icon}</div>;
    }
    const IconComponent = icon as LucideIcon;
    return <IconComponent size={isSm ? 28 : 40} className="mb-3" style={{ color: '#E8D7C0' }} />;
  };

  const renderAction = () => {
    if (!action) return null;
    if (React.isValidElement(action)) {
      return action;
    }
    const act = action as { label: string; onClick: () => void };
    if (act.label && act.onClick) {
      return (
        <button
          onClick={act.onClick}
          className="px-4 py-2 rounded-xl font-bold text-[13px] transition-all hover:shadow-lg"
          style={{ background: '#8B4A1E', color: 'white' }}
        >
          {act.label}
        </button>
      );
    }
    return null;
  };

  return (
    <div className={`flex flex-col items-center justify-center text-center px-4 ${isSm ? 'py-6' : 'py-10'}`}>
      {renderIcon()}
      <p className={`font-bold mb-1 ${isSm ? 'text-[13px]' : 'text-[15px]'}`} style={{ color: '#2B1810' }}>{title}</p>
      {description && (
        <p className={`mb-4 max-w-sm ${isSm ? 'text-[11px]' : 'text-[13px]'}`} style={{ color: '#6B5448' }}>
          {description}
        </p>
      )}
      {renderAction()}
    </div>
  );
};
