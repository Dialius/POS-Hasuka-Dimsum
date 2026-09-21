import React from 'react';
import { EmptyState } from '../common/EmptyState';

interface AnalyticsTabProps {
  categoryDistribution: any[];
  paymentMethods: any[];
  peakHours: any[];
  financialSummary: {
    revenue: string;
    cogs: string;
    profit: string;
    margin: string;
  };
  voidAnalysis: {
    success: number;
    voided: number;
    successRate: string;
    potentialLoss: string;
  };
  isLoading: boolean;
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  categoryDistribution,
  paymentMethods,
  peakHours,
  financialSummary,
  voidAnalysis,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-700" />
      </div>
    );
  }

  const hasValidPeakHours = peakHours.some(p => p.percentage > 0);

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Category Distribution */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Distribusi Kategori</h3>
        {categoryDistribution.length > 0 ? (
          <div className="space-y-4">
            {categoryDistribution.map((cat, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{cat.name}</span>
                  <span className="font-medium text-gray-900">{cat.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-amber-700 h-2 rounded-full"
                    style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon="📊"
            title="Tidak Ada Data"
            description="Muncul saat ada transaksi"
            size="sm"
          />
        )}
      </div>

      {/* Payment Methods */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Metode Pembayaran</h3>
        {paymentMethods.length > 0 ? (
          <div className="space-y-4">
            {paymentMethods.map((method, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-gray-700">{method.name}</span>
                <span className="font-semibold text-gray-900">{method.percentage}%</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon="💳"
            title="Tidak Ada Data"
            description="Metode muncul di sini"
            size="sm"
          />
        )}
      </div>

      {/* Peak Hours */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Jam Sibuk</h3>
        {hasValidPeakHours ? (
          <div className="space-y-4">
            {peakHours.map((hour, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{hour.label}</span>
                  <span className="font-medium text-gray-900">{hour.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${hour.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon="⏰"
            title="Belum Ada Transaksi"
            description="Jam sibuk muncul saat ada data"
            size="sm"
          />
        )}
      </div>

      {/* Financial Summary */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Ringkasan Keuangan</h3>
        <div className="space-y-4">
          <div>
            <div className="text-sm text-gray-600 mb-1">Omzet</div>
            <div className="text-xl font-bold text-gray-900">{financialSummary.revenue}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">HPP</div>
            <div className="text-lg font-semibold text-gray-700">{financialSummary.cogs}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Laba Kotor</div>
            <div className="text-lg font-semibold text-green-600">{financialSummary.profit}</div>
          </div>
          <div className="pt-2 border-t border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Margin</div>
            <div className="text-2xl font-bold text-amber-700">{financialSummary.margin}</div>
          </div>
        </div>
      </div>

      {/* Void Analysis */}
      <div className="bg-white rounded-lg p-6 border border-gray-200 lg:col-span-2">
        <h3 className="text-lg font-semibold mb-4">Analisis Pembatalan</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600 mb-1">Sukses</div>
            <div className="text-2xl font-bold text-green-600">{voidAnalysis.success}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Dibatalkan</div>
            <div className="text-2xl font-bold text-red-600">{voidAnalysis.voided}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Success Rate</div>
            <div className="text-lg font-semibold text-gray-900">{voidAnalysis.successRate}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Potensi Kehilangan</div>
            <div className="text-lg font-semibold text-gray-900">{voidAnalysis.potentialLoss}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
