import React, { useState, useMemo } from 'react';
import { DataTable, Column } from '../common/DataTable';
import { Button } from '../common/Button';

interface Transaction {
  id: string;
  invoiceNo: string;
  timestamp: string;
  total: string;
  cashier: string;
  paymentMethod: string;
  status: 'success' | 'void';
  items: any[];
}

interface TransactionsTabProps {
  transactions: Transaction[];
  isLoading: boolean;
  onVoidTransaction: (transaction: Transaction) => void;
  onViewDetail: (transaction: Transaction) => void;
}

export const TransactionsTab: React.FC<TransactionsTabProps> = ({
  transactions,
  isLoading,
  onVoidTransaction,
  onViewDetail,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const itemsPerPage = 15;

  const filteredTransactions = useMemo(() => {
    let result = transactions.filter(tx =>
      tx.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortKey) {
      result = [...result].sort((a, b) => {
        let aVal: any = a[sortKey as keyof Transaction];
        let bVal: any = b[sortKey as keyof Transaction];

        if (sortKey === 'timestamp') {
          aVal = new Date(aVal as string).getTime();
          bVal = new Date(bVal as string).getTime();
        }

        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [transactions, searchTerm, sortKey, sortDirection]);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTransactions, currentPage, itemsPerPage]);

  const columns: Column[] = [
    {
      key: 'invoiceNo',
      label: 'Invoice',
      sortable: true,
      render: (row) => <span className="font-medium">{row.invoiceNo}</span>,
    },
    {
      key: 'timestamp',
      label: 'Waktu',
      sortable: true,
      render: (row) => (
        <span className="text-gray-600">
          {new Date(row.timestamp).toLocaleString('id-ID')}
        </span>
      ),
    },
    {
      key: 'total',
      label: 'Total',
      sortable: true,
      render: (row) => <span className="font-medium text-right block">{row.total}</span>,
    },
    {
      key: 'cashier',
      label: 'Kasir',
      sortable: true,
      render: (row) => <span className="text-gray-600">{row.cashier}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <div className="flex justify-center">
          {row.status === 'void' ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              VOID
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              OK
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Aksi',
      render: (row) => (
        <div className="flex items-center justify-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => onViewDetail(row)}>
            Detail
          </Button>
          {row.status !== 'void' && (
            <Button size="sm" variant="destructive" onClick={() => onVoidTransaction(row)}>
              Void
            </Button>
          )}
        </div>
      ),
    },
  ];

  const handleSort = (key: string, direction: 'asc' | 'desc') => {
    setSortKey(key);
    setSortDirection(direction);
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Cari nomor invoice..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>
        <div className="text-sm text-gray-500">
          {filteredTransactions.length} transaksi
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={paginatedTransactions}
        isLoading={isLoading}
        onSort={handleSort}
        emptyState={{
          title: searchTerm ? `Tidak ada hasil untuk "${searchTerm}"` : 'Belum Ada Transaksi',
          description: searchTerm ? 'Coba kata kunci lain' : 'Transaksi muncul saat ada penjualan',
        }}
        pagination={{
          page: currentPage,
          pageSize: itemsPerPage,
          total: filteredTransactions.length,
          onPageChange: setCurrentPage,
        }}
      />
    </div>
  );
};
