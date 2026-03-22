import request from './request';

// 商家端仪表盘图表项。
export interface ChartData {
  name: string;
  value: number;
}

// 商家端首页概览数据。
export interface DashboardData {
  totalOrders: number;
  totalSales: number;
  todayOrders: number;
  todaySales: number;
  productCount: number;
  
  // 待处理事项卡片数据。
  pendingPayment: number;
  pendingShipment: number;
  pendingAudit: number;
  pendingRefund: number;

  orderTrend: ChartData[];
  salesTrend: ChartData[];
}

// 获取商家仪表盘统计信息。
export const getDashboardStatistics = () => {
  return request.get<DashboardData>('/dashboard/seller/stats');
};
