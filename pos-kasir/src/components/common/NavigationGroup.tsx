import React, { useState } from 'react';

interface NavItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
}

interface NavigationGroupProps {
  label: string;
  items: NavItem[];
  defaultOpen?: boolean;
  activeItemId?: string;
}

export const NavigationGroup: React.FC<NavigationGroupProps> = ({
  label,
  items,
  defaultOpen = false,
  activeItemId,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-2">
      {/* Group Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        aria-expanded={isOpen}
      >
        <span>{label}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Group Items */}
      {isOpen && (
        <div className="mt-1 ml-2 space-y-1">
          {items.map((item) => {
            const isActive = item.id === activeItemId;
            return (
              <button
                key={item.id}
                onClick={item.onClick}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                  isActive
                    ? 'bg-amber-50 text-amber-800 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {item.icon && <span className="w-5 h-5">{item.icon}</span>}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
