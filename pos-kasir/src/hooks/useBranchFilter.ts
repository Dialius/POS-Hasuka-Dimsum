import { useState, useCallback } from 'react';

export type BranchId = 'all' | string;

export const useBranchFilter = (initialBranch: BranchId = 'all') => {
  const [selectedBranch, setSelectedBranch] = useState<BranchId>(initialBranch);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const selectBranch = useCallback((branchId: BranchId) => {
    setSelectedBranch(branchId);
    setIsDropdownOpen(false);
  }, []);

  const toggleDropdown = useCallback(() => {
    setIsDropdownOpen((prev) => !prev);
  }, []);

  const closeDropdown = useCallback(() => {
    setIsDropdownOpen(false);
  }, []);

  return {
    selectedBranch,
    isDropdownOpen,
    selectBranch,
    toggleDropdown,
    closeDropdown,
    setSelectedBranch,
  };
};
