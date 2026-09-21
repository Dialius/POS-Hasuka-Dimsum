import React from 'react';
import { EmptyState } from '../common/EmptyState';
import { Button } from '../common/Button';

interface Ingredient {
  id: string;
  name: string;
  currentStock: number;
  unit: string;
  minStock: number;
  status: 'ok' | 'warning' | 'critical';
}

interface RawStockTabProps {
  ingredients: Ingredient[];
  isLoading: boolean;
  onStockIn: () => void;
  onStockOpname: () => void;
  onManageIngredients: () => void;
}

export const RawStockTab: React.FC<RawStockTabProps> = ({
  ingredients,
  isLoading,
  onStockIn,
  onStockOpname,
  onManageIngredients,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-700" />
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      ok: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      critical: 'bg-red-100 text-red-800',
    };
    const labels = {
      ok: 'Aman',
      warning: 'Perlu Restock',
      critical: 'Kritis',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[status as keyof typeof variants]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const getStockPercentage = (current: number, min: number) => {
    if (min === 0) return 100;
    return Math.min((current / min) * 100, 100);
  };

  const criticalCount = ingredients.filter(i => i.status === 'critical').length;
  const warningCount = ingredients.filter(i => i.status === 'warning').length;

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Stok Bahan Baku</h2>
          <p className="text-sm text-gray-500 mt-1">
            Monitor stok ingredient & kemasan
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onStockIn}>
            Stock In
          </Button>
          <Button variant="secondary" onClick={onStockOpname}>
            Stok Opname
          </Button>
          <Button onClick={onManageIngredients}>
            Kelola Bahan
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {(criticalCount > 0 || warningCount > 0) && (
        <div className="space-y-2">
          {criticalCount > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-4">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <h4 className="text-sm font-semibold text-red-800">Stok Kritis</h4>
                <p className="text-sm text-red-700 mt-0.5">
                  {criticalCount} bahan berada di bawah minimum stock. Segera lakukan restock!
                </p>
              </div>
            </div>
          )}
          {warningCount > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-4">
              <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h4 className="text-sm font-semibold text-yellow-800">Perhatian</h4>
                <p className="text-sm text-yellow-700 mt-0.5">
                  {warningCount} bahan mendekati minimum stock. Rencanakan restock segera.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ingredients Grid */}
      {ingredients.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ingredients.map((ingredient) => (
            <div
              key={ingredient.id}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{ingredient.name}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{ingredient.unit}</p>
                </div>
                {getStatusBadge(ingredient.status)}
              </div>

              <div className="space-y-2">
                <div className="flex items-end justify-between">
                  <span className="text-2xl font-bold text-gray-900">
                    {ingredient.currentStock}
                  </span>
                  <span className="text-sm text-gray-500">
                    Min: {ingredient.minStock}
                  </span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      ingredient.status === 'critical'
                        ? 'bg-red-600'
                        : ingredient.status === 'warning'
                        ? 'bg-yellow-600'
                        : 'bg-green-600'
                    }`}
                    style={{ width: `${getStockPercentage(ingredient.currentStock, ingredient.minStock)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="📦"
          title="Belum Ada Bahan Baku"
          description="Tambahkan bahan baku untuk mulai tracking stok"
          action={<Button onClick={onManageIngredients}>Kelola Bahan</Button>}
        />
      )}
    </div>
  );
};
