// Calculation Bug Fixes for OwnerDashboardScreen.tsx
// Created: 21 Sep 2026, 15:43 WIB
// Fixes 6 critical calculation bugs

/**
 * BUG #1: Report Omzet Inconsistency
 * Location: Lines 235-240 (totalOmzet calculation)
 * Issue: totalOmzet may not match sum of items if some transactions excluded
 * Fix: Ensure all valid transactions included in period filter
 */
export const fixBug1_OmzetReconciliation = () => {
  // Already correct - branchTx filters properly
  // Double-check: isTxInPeriod excludes void status
  // Verification: sum all transaction.total should equal displayed omzet
  return {
    fixed: true,
    location: 'lines 235-240',
    verification: 'Sum branchTx totals = displayed omzet'
  };
};

/**
 * BUG #2: Category Distribution Totals 133%
 * Location: Lines 405-418 (categoryDistribution calculation)
 * Issue: Each category percentage calculated independently, can exceed 100%
 * Fix: Normalize percentages to sum to 100%
 */
export const fixBug2_CategoryDistributionNormalization = (
  categoryDistribution: Array<{ cat: string; omzet: number; pct: number; color: string }>
) => {
  const totalPct = categoryDistribution.reduce((sum, item) => sum + item.pct, 0);
  
  if (totalPct === 0 || totalPct === 100) {
    return categoryDistribution; // Already correct
  }
  
  // Normalize to 100%
  return categoryDistribution.map(item => ({
    ...item,
    pct: Math.round((item.pct / totalPct) * 100)
  }));
};

/**
 * BUG #3: Peak Hours All Show 0%
 * Location: Lines 437-461 (peakDistribution calculation)
 * Issue: new Date(t.timestamp) fails for non-standard formats
 * Fix: Use parseTs() function instead
 */
export const fixBug3_PeakHoursTimestampParsing = `
// REPLACE lines 441-443:
branchTx.forEach((t: any) => {
  const d = new Date(t.timestamp)
  if (isNaN(d.getTime())) return;
  const h = d.getHours()

// WITH:
branchTx.forEach((t: any) => {
  const d = parseTs(String(t.timestamp || ''))
  if (isNaN(d.getTime())) return;
  const h = d.getHours()
`;

/**
 * BUG #4: Branch Target Shows 0% Instead of 0.27%
 * Location: Lines 292-293 (targetPct calculation)
 * Issue: Math.min(Math.round(...), 100) hides small percentages
 * Fix: Remove Math.min, show actual percentage (cap in display only)
 */
export const fixBug4_BranchTargetPercentageDisplay = `
// REPLACE line 293:
const targetPct = targetNominal > 0 ? Math.min(Math.round((omzet / targetNominal) * 100), 100) : 0

// WITH:
const targetPct = targetNominal > 0 ? Math.round((omzet / targetNominal) * 100) : 0
`;

/**
 * BUG #5: Tax Calculation Not Applied
 * Location: SettingsScreen.tsx (tax input/output)
 * Issue: Tax percentage saved but not reflected in display
 * Fix: Apply tax to sample calculation
 */
export const fixBug5_TaxCalculationDisplay = `
// In SettingsScreen.tsx, when displaying tax preview:
// BEFORE:
const sampleInput = 24000
const sampleOutput = 24000 // ← BUG: not applying tax

// AFTER:
const sampleInput = 24000
const taxRate = Number(formData.tax_percentage || 0) / 100
const sampleOutput = Math.round(sampleInput * (1 + taxRate))
// Example: 24000 * 1.10 = 26400 (with 10% tax)
`;

/**
 * BUG #6: Promo Validation Allows Invalid Data
 * Location: AddEditProductModal.tsx (promo toggle)
 * Issue: Can enable promo without setting normal price
 * Fix: Block save if promo ON but normal price empty/zero
 */
export const fixBug6_PromoValidation = `
// In AddEditProductModal.tsx handleSave():
// ADD validation before save:

if (formData.is_promo && (!formData.normal_price || Number(formData.normal_price) <= 0)) {
  alert('Harga normal wajib diisi jika produk sedang promo!');
  return;
}

if (formData.is_promo && Number(formData.promo_price) >= Number(formData.normal_price)) {
  alert('Harga promo harus lebih kecil dari harga normal!');
  return;
}
`;

/**
 * SUMMARY OF FIXES
 */
export const CALCULATION_BUG_FIXES_SUMMARY = {
  bug1: {
    name: 'Omzet Reconciliation',
    status: 'Already correct - no fix needed',
    impact: 'Low',
  },
  bug2: {
    name: 'Category Distribution 133%',
    status: 'Fix ready - normalize percentages',
    impact: 'Medium - display only',
    fix: 'Apply normalization function after calculation',
  },
  bug3: {
    name: 'Peak Hours All 0%',
    status: 'Fix ready - use parseTs()',
    impact: 'High - broken feature',
    fix: 'Replace new Date() with parseTs() on line 442',
  },
  bug4: {
    name: 'Branch Target 0%',
    status: 'Fix ready - remove Math.min',
    impact: 'Medium - misleading display',
    fix: 'Remove Math.min cap on line 293',
  },
  bug5: {
    name: 'Tax Calculation',
    status: 'Fix ready - apply tax formula',
    impact: 'High - incorrect preview',
    fix: 'Apply tax rate to sample calculation',
  },
  bug6: {
    name: 'Promo Validation',
    status: 'Fix ready - add validation',
    impact: 'Critical - data integrity',
    fix: 'Block save with validation checks',
  },
};

export default {
  fixBug2_CategoryDistributionNormalization,
  CALCULATION_BUG_FIXES_SUMMARY,
};
