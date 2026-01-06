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
  productCount: number;
  
  // To-Do
  pendingPayment: number;
  pendingShipment: number;
  pendingAudit: number;
  pendingRefund: number;

  orderTrend: ChartData[];
  salesTrend: ChartData[];
}

export const getDashboardStatistics = () => {
  return request.get<DashboardData>('/dashboard/seller/stats');
};
