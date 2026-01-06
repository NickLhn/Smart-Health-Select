import request from './request';

export interface ChartData {
  name: string;
  value: number;
}

export interface DashboardData {
  totalOrders: number;
  totalSales: number;
  todayOrders: number;
  todaySales: number;
  totalUsers: number;

  // To-Do
  pendingAudit: number;
  pendingRefund: number;

  orderTrend: ChartData[];
  statusDistribution: ChartData[];
}

export const getDashboardStatistics = () => {
  return request.get<DashboardData>('/dashboard/admin/stats');
};
