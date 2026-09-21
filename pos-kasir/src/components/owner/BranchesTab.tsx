import React, { useState } from 'react';
import { Button } from '../common/Button';
import { EmptyState } from '../common/EmptyState';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface Branch {
  id: string;
  name: string;
  address: string;
  status: 'active' | 'inactive';
  revenue: string;
  orders: number;
  target: number;
  targetAmount: string;
  targetProgress: number;
}

interface BranchesTabProps {
  branches: Branch[];
  isLoading: boolean;
  onAddBranch: () => void;
  onEditBranch: (branch: Branch) => void;
  onDeleteBranch: (branchId: string) => void;
}

export const BranchesTab: React.FC<BranchesTabProps> = ({
  branches,
  isLoading,
  onAddBranch,
  onEditBranch,
  onDeleteBranch,
}) => {
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-700" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Daftar Cabang</h2>
          <p className="text-sm text-gray-500 mt-1">Kelola outlet dan target cabang</p>
        </div>
        <Button onClick={onAddBranch}>
          Tambah Cabang
        </Button>
      </div>

      {/* Branches Grid */}
      {branches.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-6">
          {branches.map((branch) => (
            <div key={branch.id} className="bg-white rounded-lg border border-gray-200 p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-gray-900">{branch.name}</h3>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        branch.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {branch.status === 'active' ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2">{branch.address}</p>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Omzet</div>
                  <div className="text-xl font-bold text-gray-900">{branch.revenue}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Transaksi</div>
                  <div className="text-xl font-bold text-gray-900">{branch.orders}</div>
                </div>
              </div>

              {/* Target Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">Target: {branch.targetAmount}</span>
                  <span className="font-medium text-gray-900">{branch.targetProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-amber-700 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(branch.targetProgress, 100)}%` }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <Button
                  variant="secondary"
                  size="sm"
                  fullWidth
                  onClick={() => onEditBranch(branch)}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  fullWidth
                  onClick={() => setDeleteConfirm({ id: branch.id, name: branch.name })}
                >
                  Hapus
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="🏪"
          title="Belum Ada Cabang"
          description="Tambahkan cabang pertama untuk mulai tracking performa"
          action={<Button onClick={onAddBranch}>Tambah Cabang</Button>}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        variant="destructive"
        title="Hapus Cabang?"
        description={`Apakah Anda yakin ingin menghapus "${deleteConfirm?.name}"? Data transaksi cabang tetap tersimpan.`}
        confirmLabel="Hapus"
        cancelLabel="Batal"
        onConfirm={() => {
          if (deleteConfirm) {
            onDeleteBranch(deleteConfirm.id);
            setDeleteConfirm(null);
          }
        }}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
};
