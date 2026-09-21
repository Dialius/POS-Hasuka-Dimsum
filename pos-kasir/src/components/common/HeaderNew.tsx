import React from 'react';
import { PeriodDropdown } from './PeriodDropdown';
import { UserMenu } from './UserMenu';

interface Branch {
  id: string;
  name: string;
}

interface HeaderNewProps {
  title?: string;
  selectedPeriod: string;
  selectedBranches: string[];
  branches: Branch[];
  userName: string;
  userRole: 'owner' | 'kasir';
  onPeriodChange: (period: string, startDate?: Date, endDate?: Date) => void;
  onBranchChange: (branchIds: string[]) => void;
  onExport: () => void;
  onLogout: () => void;
  onSettings?: () => void;
  showExport?: boolean;
}

export const HeaderNew: React.FC<HeaderNewProps> = ({
  title = 'Command Center Owner',
  selectedPeriod,
  selectedBranches,
  branches,
  userName,
  userRole,
  onPeriodChange,
  onBranchChange,
  onExport,
  onLogout,
  onSettings,
  showExport = true,
}) => {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left: Title */}
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-gray-900">
            {title}
          </h1>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-4">
          {/* Period & Branch Filter */}
          <PeriodDropdown
            selectedPeriod={selectedPeriod}
            selectedBranches={selectedBranches}
            branches={branches}
            onPeriodChange={onPeriodChange}
            onBranchChange={onBranchChange}
          />

          {/* Export Button */}
          {showExport && (
            <button
              onClick={onExport}
              className="flex items-center gap-2 px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-colors font-medium"
              aria-label="Export data"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Ekspor</span>
            </button>
          )}

          {/* User Menu */}
          <UserMenu
            userName={userName}
            userRole={userRole}
            onLogout={onLogout}
            onSettings={onSettings}
          />
        </div>
      </div>
    </header>
  );
};
