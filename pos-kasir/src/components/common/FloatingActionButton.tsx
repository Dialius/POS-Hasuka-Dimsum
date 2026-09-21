import React, { useState } from 'react';

interface SpeedDialAction {
  id: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

interface FloatingActionButtonProps {
  actions: SpeedDialAction[];
  position?: 'bottom-right' | 'bottom-left';
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  actions,
  position = 'bottom-right',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      {/* Speed Dial Menu */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 mb-2 space-y-2">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={() => {
                action.onClick();
                setIsOpen(false);
              }}
              className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-lg hover:bg-gray-50 transition-colors group"
              title={action.label}
            >
              <span className="w-5 h-5 text-amber-700">{action.icon}</span>
              <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Main FAB Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-amber-700 text-white rounded-full shadow-lg hover:bg-amber-800 transition-all flex items-center justify-center"
        aria-label={isOpen ? 'Close menu' : 'Open quick actions'}
        aria-expanded={isOpen}
      >
        <svg
          className={`w-6 h-6 transition-transform ${isOpen ? 'rotate-45' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
};
