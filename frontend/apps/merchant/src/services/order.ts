import request from './request';

export interface OrderQuery {
  page?: number;
  size?: number;
  status?: number;
  orderNo?: string;
  startTime?: string;
  endTime?: string;
}

export interface OrderItem {
  id: number;
  orderId: number;
  medicineId: number;
  medicineName: string;
  medicineImage: string;
  medicinePrice: number;
  count: number;
}

export interface Order {
  id: number;
  orderNo: string;
  userId: number;
  sellerId: number;
  totalAmount: number;
  couponAmount: number;
  payAmount: number;
  freightAmount: number;
  status: number; // 0待支付 1待发货 2待收货 3已完成 4已取消 5已退款 7待审核
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  createTime: string;
  payTime?: string;
  deliveryTime?: string;
  finishTime?: string;
  items: OrderItem[];
  prescriptionImage?: string; // 处方图
  auditReason?: string; // 审核拒绝原因
  refundReason?: string; // 退款原因
}

export interface PageResult<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

export interface Result<T> {
  code: number;
  message: string;
  data: T;
}

// 获取商家订单列表
export const getSellerOrderList = (params: OrderQuery) => {
  return request.get<PageResult<Order>>('/orders/seller/list', { params });
};

// 商家发货
export const shipOrder = (orderId: number) => {
  return request.post(`/orders/${orderId}/ship`);
};

// 商家审核处方
export const auditOrder = (orderId: number, status: number, reason?: string) => {
  return request.post(`/orders/${orderId}/audit`, { status, reason });
};

// 商家处理退款
export const processRefund = (orderId: number, status: number, remark?: string) => {
  return request.post(`/orders/${orderId}/refund/process`, { status, remark });
};

// 获取订单详情
export const getOrderDetail = (orderId: number) => {
  return request.get<Order>(`/orders/${orderId}`);
};
