import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { EmptyState } from '../common/EmptyState';
import { Button } from '../common/Button';

interface Metric {
  label: string;
  value: string;
  trend?: 'up' | 'down' | 'neutral';
  subtext?: string;
}

interface OverviewTabProps {
  metrics: Metric[];
  chartData: any[];
  topProducts: any[];
  isLoading: boolean;
  onNavigateToMenu: () => void;
  onNavigateToRecipe: () => void;
  onNavigateToPromo: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  metrics,
  chartData,
  topProducts,
  isLoading,
  onNavigateToMenu,
  onNavigateToRecipe,
  onNavigateToPromo,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-700" />
      </div>
    );
  }

  const getTrendIcon = (trend?: 'up' | 'down' | 'neutral') => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  return (
    <div className="space-y-6">
      {/* KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, idx) => (
          <div key={idx} className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">{metric.label}</span>
              {getTrendIcon(metric.trend)}
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {metric.value}
            </div>
            {metric.subtext && (
              <div className="text-xs text-gray-500">{metric.subtext}</div>
            )}
          </div>
        ))}
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Tren Pendapatan</h3>
        {chartData.length >= 3 ? (
          <div className="h-64">
            {/* Chart implementation */}
            <div className="text-gray-500 text-center py-12">
              Chart visualization here
            </div>
          </div>
        ) : (
          <EmptyState
            icon="📊"
            title="Belum Cukup Data"
            description="Minimal 3 hari data"
            size="sm"
          />
        )}
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">
            Menu Terlaris ({topProducts.length})
          </h3>
          {topProducts.length > 0 ? (
            <div className="space-y-4">
              {topProducts.slice(0, 5).map((product, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">
                      {product.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {product.quantity} porsi
                    </div>
                  </div>
                  <div className="font-semibold text-gray-900">
                    {product.revenue}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="🍽️"
              title="Belum Ada Penjualan"
              description="Terlaris muncul di sini"
              size="sm"
              action={
                <Button variant="secondary" onClick={onNavigateToMenu}>
                  Kelola Menu
                </Button>
              }
            />
          )}
        </div>

        {/* Quick Actions - Removed, will use FAB instead */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Manajemen Cepat</h3>
          <div className="space-y-4">
            <Button variant="secondary" fullWidth onClick={onNavigateToMenu}>
              Kelola Menu
            </Button>
            <Button variant="secondary" fullWidth onClick={onNavigateToRecipe}>
              Atur Resep
            </Button>
            <Button variant="secondary" fullWidth onClick={onNavigateToPromo}>
              Kelola Promo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
