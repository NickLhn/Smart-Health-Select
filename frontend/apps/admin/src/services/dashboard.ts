import request from './request';

// 管理端仪表盘图表项。
export interface ChartData {
  name: string;
  value: number;
}

// 管理端首页概览数据。
export interface DashboardData {
  totalOrders: number;
  totalSales: number;
  todayOrders: number;
  todaySales: number;
  totalUsers: number;

  // 这两个字段用于管理端待处理事项卡片。
  pendingAudit: number;
  pendingRefund: number;

  orderTrend: ChartData[];
  statusDistribution: ChartData[];
}

// 当前仪表盘直接走订单模块暴露的统计接口，旧统计模块只做兼容保留。
export const getDashboardStatistics = () => {
  return request.get<DashboardData>('/dashboard/admin/stats');
};
