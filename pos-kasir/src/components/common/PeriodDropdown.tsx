import React, { useState, useRef, useEffect } from 'react';

interface Branch {
  id: string;
  name: string;
}

interface PeriodDropdownProps {
  selectedPeriod: string;
  selectedBranches: string[];
  branches: Branch[];
  onPeriodChange: (period: string, startDate?: Date, endDate?: Date) => void;
  onBranchChange: (branchIds: string[]) => void;
}

type PeriodOption = 
  | 'Hari Ini' 
  | '7 Hari Terakhir' 
  | 'Bulan Ini' 
  | 'Custom Range...';

export const PeriodDropdown: React.FC<PeriodDropdownProps> = ({
  selectedPeriod,
  selectedBranches,
  branches,
  onPeriodChange,
  onBranchChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const periods: PeriodOption[] = [
    'Hari Ini',
    '7 Hari Terakhir',
    'Bulan Ini',
    'Custom Range...',
  ];

  const handlePeriodSelect = (period: PeriodOption) => {
    if (period === 'Custom Range...') {
      setShowCustomModal(true);
      setIsOpen(false);
      return;
    }
    onPeriodChange(period);
    setIsOpen(false);
  };

  const handleBranchToggle = (branchId: string) => {
    const newSelection = selectedBranches.includes(branchId)
      ? selectedBranches.filter(id => id !== branchId)
      : [...selectedBranches, branchId];
    
    // Prevent deselecting all branches
    if (newSelection.length === 0) return;
    
    onBranchChange(newSelection);
  };

  const handleCustomApply = () => {
    if (!customStart || !customEnd) return;
    
    const startDate = new Date(customStart);
    const endDate = new Date(customEnd);
    
    if (endDate < startDate) {
      alert('Tanggal selesai harus setelah tanggal mulai');
      return;
    }
    
    onPeriodChange('Custom', startDate, endDate);
    setShowCustomModal(false);
    setCustomStart('');
    setCustomEnd('');
  };

  const getDisplayText = () => {
    if (selectedPeriod === 'Custom') {
      return `Custom: ${customStart} - ${customEnd}`;
    }
    
    const branchText = selectedBranches.length === branches.length
      ? 'Semua Cabang'
      : selectedBranches.length === 1
      ? branches.find(b => b.id === selectedBranches[0])?.name || ''
      : `${selectedBranches.length} Cabang`;
    
    return `${selectedPeriod} • ${branchText}`;
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          aria-label="Filter periode dan cabang"
          aria-expanded={isOpen}
        >
          <span className="text-sm font-medium text-gray-700">
            {getDisplayText()}
          </span>
          <svg
            className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            {/* Period Section */}
            <div className="p-3 border-b border-gray-200">
              <div className="text-xs font-semibold text-gray-500 uppercase mb-2">
                Periode
              </div>
              {periods.map((period) => (
                <button
                  key={period}
                  onClick={() => handlePeriodSelect(period)}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                    selectedPeriod === period
                      ? 'bg-amber-50 text-amber-800 font-medium'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>

            {/* Branch Section */}
            <div className="p-3">
              <div className="text-xs font-semibold text-gray-500 uppercase mb-2">
                Cabang
              </div>
              
              {/* All Branches Toggle */}
              <label className="flex items-center px-3 py-2 rounded hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedBranches.length === branches.length}
                  onChange={() => {
                    if (selectedBranches.length === branches.length) {
                      onBranchChange([branches[0].id]);
                    } else {
                      onBranchChange(branches.map(b => b.id));
                    }
                  }}
                  className="w-4 h-4 text-amber-600 rounded focus:ring-2 focus:ring-amber-500"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  Semua Cabang
                </span>
              </label>

              {/* Individual Branches */}
              {branches.map((branch) => (
                <label
                  key={branch.id}
                  className="flex items-center px-3 py-2 rounded hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedBranches.includes(branch.id)}
                    onChange={() => handleBranchToggle(branch.id)}
                    className="w-4 h-4 text-amber-600 rounded focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {branch.name}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Custom Date Range Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Custom Date Range
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Selesai
                </label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCustomModal(false);
                  setCustomStart('');
                  setCustomEnd('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleCustomApply}
                disabled={!customStart || !customEnd}
                className="flex-1 px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Terapkan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
