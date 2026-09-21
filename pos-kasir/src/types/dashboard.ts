// TypeScript interfaces for Owner Dashboard
export interface DashboardMetrics {
  totalRevenue: number;
  totalTransactions: number;
  avgTransactionValue: number;
  growthRate: number;
}

export interface Transaction {
  id: string;
  invoiceNo: string;
  timestamp: string;
  cashier: string;
  branch: string;
  total: number;
  paymentMethod: string;
  status: 'completed' | 'void';
  items: TransactionItem[];
}

export interface TransactionItem {
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  target: number;
  revenue: number;
  transactions: number;
  topProduct?: string;
}

export interface Cashier {
  id: string;
  name: string;
  pin: string;
  totalShifts: number;
  totalRevenue: number;
  avgTransactionValue: number;
  status: 'active' | 'inactive';
}

export interface Ingredient {
  id: string;
  name: string;
  currentStock: number;
  unit: string;
  minStock: number;
  lastRestocked?: string;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  percentage?: number;
}

export interface PeriodFilter {
  type: 'today' | 'week' | 'month' | 'custom';
  startDate?: Date;
  endDate?: Date;
}
