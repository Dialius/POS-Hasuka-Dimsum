import React, { useState, useEffect } from 'react';
import { HeaderNew } from './common/HeaderNew';
import { NavigationGroup } from './common/NavigationGroup';
import { FloatingActionButton } from './common/FloatingActionButton';
import { Toast } from './common/Toast';
import { OverviewTab } from './owner/OverviewTab';
import { AnalyticsTab } from './owner/AnalyticsTab';
import { TransactionsTab } from './owner/TransactionsTab';
import { BranchesTab } from './owner/BranchesTab';
import { KasirTab } from './owner/KasirTab';
import { RawStockTab } from './owner/RawStockTab';

// Toast hook
const useToast = () => {
  const [toasts, setToasts] = useState<Array<{ id: string; variant: 'success' | 'error' | 'warning' | 'info'; title: string; description?: string }>>([]);
  
  const showToast = (toast: { variant: 'success' | 'error' | 'warning' | 'info'; title: string; description?: string }) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { ...toast, id }]);
  };
  
  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };
  
  return { toasts, showToast, removeToast };
};

interface OwnerDashboardScreenNewProps {
  onBack?: () => void;
  onNavigate?: (path: string) => void;
}

type TabId = 'overview' | 'analytics' | 'transactions' | 'branches' | 'kasir' | 'rawStock';

export const OwnerDashboardScreenNew: React.FC<OwnerDashboardScreenNewProps> = ({ onNavigate: propNavigate }) => {
  const { toasts, showToast, removeToast } = useToast();
  
  // Navigation helper
  const navigate = (path: string) => {
    if (propNavigate) {
      propNavigate(path);
    } else {
      console.log('Navigate to:', path);
    }
  };
  
  // State
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [selectedPeriod] = useState('today');
  const [startDate] = useState('');
  const [endDate] = useState('');
  const [selectedBranches] = useState<string[]>(['all']);
  const [isLoading, setIsLoading] = useState(false);

  // Mock data - replace with actual API calls
  const [dashboardData, setDashboardData] = useState({
    metrics: [
      { label: 'Omzet', value: 'Rp 18.000.000', change: 15.3, trend: 'up' as const },
      { label: 'Transaksi', value: '234', change: 8.2, trend: 'up' as const },
      { label: 'Rata-rata', value: 'Rp 76.923', change: -2.1, trend: 'down' as const },
      { label: 'Customer', value: '187', change: 12.4, trend: 'up' as const },
    ],
    topProducts: [],
    categoryDistribution: [],
    paymentMethods: [],
    peakHours: [],
    transactions: [],
    branches: [],
    cashiers: [],
    ingredients: [],
    financialSummary: { revenue: 'Rp 18.000.000', cogs: 'Rp 7.200.000', profit: 'Rp 10.800.000', margin: '60%' },
    shiftTolerance: 15,
  });

  // Fetch data on mount and when filters change
  useEffect(() => {
    fetchDashboardData();
  }, [selectedPeriod, startDate, endDate, selectedBranches]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API calls
      // const response = await api.getDashboardData({ period, branches });
      // setDashboardData(response);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      showToast({
        variant: 'success',
        title: 'Data dimuat',
        description: 'Dashboard berhasil diperbarui',
      });
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Gagal memuat data',
        description: 'Terjadi kesalahan saat mengambil data dashboard',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Tab navigation
  const dashboardTabs = [
    { id: 'overview', label: 'Ringkasan', onClick: () => setActiveTab('overview') },
    { id: 'analytics', label: 'Analisis', onClick: () => setActiveTab('analytics') },
    { id: 'transactions', label: 'Transaksi', onClick: () => setActiveTab('transactions') },
  ];

  const managementTabs = [
    { id: 'branches', label: 'Cabang', onClick: () => setActiveTab('branches') },
    { id: 'kasir', label: 'Kasir', onClick: () => setActiveTab('kasir') },
    { id: 'rawStock', label: 'Bahan', onClick: () => setActiveTab('rawStock') },
  ];

  // FAB actions
  const fabActions = [
    {
      id: 'menu',
      icon: '🍽️',
      label: 'Kelola Menu',
      onClick: () => navigate('/owner/menu'),
    },
    {
      id: 'promo',
      icon: '🎉',
      label: 'Kelola Promo',
      onClick: () => navigate('/owner/promo'),
    },
    {
      id: 'recipe',
      icon: '📝',
      label: 'Kelola Resep',
      onClick: () => navigate('/owner/recipe'),
    },
    {
      id: 'ingredient',
      icon: '📦',
      label: 'Kelola Bahan',
      onClick: () => navigate('/owner/ingredients'),
    },
    {
      id: 'stockIn',
      icon: '📥',
      label: 'Stock In',
      onClick: () => navigate('/owner/stock-in'),
    },
    {
      id: 'stockOpname',
      icon: '📊',
      label: 'Stok Opname',
      onClick: () => navigate('/owner/stock-opname'),
    },
    {
      id: 'report',
      icon: '📈',
      label: 'Laporan',
      onClick: () => navigate('/owner/report'),
    },
    {
      id: 'history',
      icon: '🕐',
      label: 'Riwayat',
      onClick: () => navigate('/owner/transaction-history'),
    },
    {
      id: 'settings',
      icon: '⚙️',
      label: 'Pengaturan',
      onClick: () => navigate('/owner/settings'),
    },
  ];

  // Handlers
  const handleLogout = () => {
    showToast({
      variant: 'info',
      title: 'Logout',
      description: 'Anda telah keluar dari sistem',
    });
    navigate('/login');
  };

  const handleSettings = () => {
    navigate('/owner/settings');
  };

  const handleVoidTransaction = (transaction: any) => {
    showToast({
      variant: 'success',
      title: 'Transaksi dibatalkan',
      description: `Transaksi #${transaction.invoiceNo} berhasil di-void`,
    });
    fetchDashboardData();
  };

  const handleViewTransactionDetail = (_transaction: any) => {
    showToast({ variant: 'info', title: 'Fitur dalam pengembangan' });
  };

  const handleAddBranch = () => {
    showToast({ variant: 'info', title: 'Fitur dalam pengembangan' });
  };

  const handleEditBranch = (_branch: any) => {
    showToast({ variant: 'info', title: 'Fitur dalam pengembangan' });
  };

  const handleDeleteBranch = (_branchId: string) => {
    showToast({
      variant: 'success',
      title: 'Cabang dihapus',
      description: 'Data cabang berhasil dihapus',
    });
    fetchDashboardData();
  };

  const handleAddCashier = () => {
    showToast({ variant: 'info', title: 'Fitur dalam pengembangan' });
  };

  const handleEditCashier = (_cashier: any) => {
    showToast({ variant: 'info', title: 'Fitur dalam pengembangan' });
  };

  const handleDeleteCashier = (_cashierId: string) => {
    showToast({
      variant: 'success',
      title: 'Kasir dihapus',
      description: 'Data kasir berhasil dihapus',
    });
    fetchDashboardData();
  };

  const handleSaveTolerance = async (tolerance: number) => {
    // TODO: Save to backend
    setDashboardData(prev => ({ ...prev, shiftTolerance: tolerance }));
    showToast({
      variant: 'success',
      title: 'Toleransi disimpan',
      description: `Batas keterlambatan diatur ke ${tolerance} menit`,
    });
  };

  const handleStockIn = () => {
    navigate('/owner/stock-in');
  };

  const handleStockOpname = () => {
    navigate('/owner/stock-opname');
  };

  const handleManageIngredients = () => {
    navigate('/owner/ingredients');
  };

  // Render active tab
  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <OverviewTab
            metrics={dashboardData.metrics}
            topProducts={dashboardData.topProducts}
            chartData={[]}
            isLoading={isLoading}
            onNavigateToMenu={() => navigate('/owner/menu')}
            onNavigateToRecipe={() => navigate('/owner/recipe')}
            onNavigateToPromo={() => navigate('/owner/promo')}
          />
        );
      case 'analytics':
        return (
          <AnalyticsTab
            categoryDistribution={dashboardData.categoryDistribution}
            paymentMethods={dashboardData.paymentMethods}
            peakHours={dashboardData.peakHours}
            financialSummary={dashboardData.financialSummary}
            voidAnalysis={{ success: 0, voided: 0, successRate: '0%', potentialLoss: 'Rp 0' }}
            isLoading={isLoading}
          />
        );
      case 'transactions':
        return (
          <TransactionsTab
            transactions={dashboardData.transactions}
            isLoading={isLoading}
            onVoidTransaction={handleVoidTransaction}
            onViewDetail={handleViewTransactionDetail}
          />
        );
      case 'branches':
        return (
          <BranchesTab
            branches={dashboardData.branches}
            isLoading={isLoading}
            onAddBranch={handleAddBranch}
            onEditBranch={handleEditBranch}
            onDeleteBranch={handleDeleteBranch}
          />
        );
      case 'kasir':
        return (
          <KasirTab
            cashiers={dashboardData.cashiers}
            shiftTolerance={dashboardData.shiftTolerance}
            isLoading={isLoading}
            onAddCashier={handleAddCashier}
            onEditCashier={handleEditCashier}
            onDeleteCashier={handleDeleteCashier}
            onSaveTolerance={handleSaveTolerance}
          />
        );
      case 'rawStock':
        return (
          <RawStockTab
            ingredients={dashboardData.ingredients}
            isLoading={isLoading}
            onStockIn={handleStockIn}
            onStockOpname={handleStockOpname}
            onManageIngredients={handleManageIngredients}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <HeaderNew
        selectedPeriod="today"
        selectedBranches={['all']}
        branches={[{ id: 'all', name: 'Semua Cabang' }]}
        userName="Owner"
        userRole="owner"
        onPeriodChange={() => {}}
        onBranchChange={() => {}}
        onExport={() => showToast({ variant: 'info', title: 'Mengekspor data...' })}
        onLogout={handleLogout}
        onSettings={handleSettings}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Navigation */}
        <div className="mb-6 space-y-2">
          <NavigationGroup
            label="Dashboard"
            items={dashboardTabs}
            defaultOpen={true}
          />
          <NavigationGroup
            label="Management"
            items={managementTabs}
            defaultOpen={false}
          />
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {renderActiveTab()}
        </div>
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton actions={fabActions} />

      {/* Toast Notifications */}
      {toasts.map((toast: { id: string; variant: 'success' | 'error' | 'warning' | 'info'; title: string; description?: string }) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};
