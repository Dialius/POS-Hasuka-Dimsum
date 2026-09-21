import React, { useState, useMemo } from 'react';
import { DataTable, Column } from '../common/DataTable';
import { Button } from '../common/Button';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface Cashier {
  id: string;
  name: string;
  branch: string;
  role: string;
  ordersCompleted: number;
  totalCash: string;
  voidCount: number;
  status: 'active' | 'inactive';
}

interface KasirTabProps {
  cashiers: Cashier[];
  shiftTolerance: number;
  isLoading: boolean;
  onAddCashier: () => void;
  onEditCashier: (cashier: Cashier) => void;
  onDeleteCashier: (cashierId: string) => void;
  onSaveTolerance: (tolerance: number) => void;
}

export const KasirTab: React.FC<KasirTabProps> = ({
  cashiers,
  shiftTolerance,
  isLoading,
  onAddCashier,
  onEditCashier,
  onDeleteCashier,
  onSaveTolerance,
}) => {
  const [localTolerance, setLocalTolerance] = useState(shiftTolerance);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSaveTolerance = async () => {
    setIsSaving(true);
    try {
      await onSaveTolerance(localTolerance);
    } finally {
      setIsSaving(false);
    }
  };

  const sortedCashiers = useMemo(() => {
    if (!sortKey) return cashiers;

    return [...cashiers].sort((a, b) => {
      let aVal = a[sortKey as keyof Cashier];
      let bVal = b[sortKey as keyof Cashier];

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [cashiers, sortKey, sortDirection]);

  const columns: Column[] = [
    {
      key: 'name',
      label: 'Nama',
      sortable: true,
      render: (row) => <span className="font-medium">{row.name}</span>,
    },
    {
      key: 'branch',
      label: 'Outlet',
      sortable: true,
      render: (row) => <span className="text-gray-600">{row.branch}</span>,
    },
    {
      key: 'ordersCompleted',
      label: 'Order',
      sortable: true,
      render: (row) => <div className="text-center">{row.ordersCompleted}</div>,
    },
    {
      key: 'totalCash',
      label: 'Total Kas',
      sortable: true,
      render: (row) => <span className="font-medium text-right block">{row.totalCash}</span>,
    },
    {
      key: 'voidCount',
      label: 'Void',
      sortable: true,
      render: (row) => (
        <div className="flex justify-center">
          {row.voidCount > 0 ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              {row.voidCount}
            </span>
          ) : (
            <span className="text-sm text-gray-400">0</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <div className="flex justify-center">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              row.status === 'active'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {row.status === 'active' ? 'Aktif' : 'Nonaktif'}
          </span>
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Aksi',
      render: (row) => (
        <div className="flex items-center justify-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => onEditCashier(row)}>
            Edit
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setDeleteConfirm({ id: row.id, name: row.name })}
          >
            Hapus
          </Button>
        </div>
      ),
    },
  ];

  const handleSort = (key: string, direction: 'asc' | 'desc') => {
    setSortKey(key);
    setSortDirection(direction);
  };

  return (
    <div className="space-y-6">
      {/* Shift Tolerance Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Toleransi Shift</h3>
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Batas keterlambatan login kasir (menit)
            </label>
            <input
              type="number"
              min="0"
              max="120"
              value={localTolerance}
              onChange={(e) => setLocalTolerance(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
          <Button
            onClick={handleSaveTolerance}
            loading={isSaving}
            disabled={localTolerance === shiftTolerance}
          >
            Simpan
          </Button>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Kasir dapat login hingga {localTolerance} menit setelah jadwal shift dimulai
        </p>
      </div>

      {/* Cashiers List Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Monitoring Kasir</h2>
          <p className="text-sm text-gray-500 mt-1">Kelola kasir & rekap shift</p>
        </div>
        <Button onClick={onAddCashier}>Tambah Kasir</Button>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={sortedCashiers}
        isLoading={isLoading}
        onSort={handleSort}
        emptyState={{
          title: 'Belum Ada Kasir',
          description: 'Tambahkan kasir untuk mulai operasional',
          action: { label: 'Tambah Kasir', onClick: onAddCashier },
        }}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        variant="destructive"
        title="Hapus Kasir?"
        description={`Apakah Anda yakin ingin menghapus "${deleteConfirm?.name}"? Shift history tetap tersimpan.`}
        confirmLabel="Hapus"
        cancelLabel="Batal"
        onConfirm={() => {
          if (deleteConfirm) {
            onDeleteCashier(deleteConfirm.id);
            setDeleteConfirm(null);
          }
        }}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
};
