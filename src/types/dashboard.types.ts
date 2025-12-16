export interface AdminDashboardStats {
  overview: {
    label: string;
    value: string;
    icon?: string;
    trend: string;
  }[];
  chartData: {
    month: string;
    revenue: number;
    orders: number;
  }[];
  topProducts: {
    id: number | string;
    name: string;
    sales: number;
    revenue: number;
  }[];
  recentOrders: {
    id: string;
    customer: string;
    amount: string;
    status: string;
    date: string;
  }[];
}
