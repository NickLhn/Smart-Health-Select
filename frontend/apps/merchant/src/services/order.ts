import request from './request';

// 商家端订单相关接口，覆盖接单后的核心操作。
export interface OrderQuery {
  page?: number;
  size?: number;
  status?: number;
  orderNo?: string;
  receiverName?: string;
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
  medicineId?: number;
  medicineName?: string;
  medicineImage?: string;
  quantity?: number;
  price?: number;
  totalAmount: number;
  couponAmount: number;
  payAmount: number;
  freightAmount: number;
  status: number; // 0待支付 1待发货 2已发货 3已完成 4售后中 5已退款 6已取消 -1已取消 7待审核 8待揽收
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
  refundRemark?: string;
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

// 获取当前商家的订单分页列表。
export const getSellerOrderList = (params: OrderQuery) => {
  return request.get<PageResult<Order>>('/orders/seller/list', { params });
};

// 发货后订单会进入配送或待收货流程。
export const shipOrder = (orderId: number) => {
  return request.post(`/orders/${orderId}/ship`);
};

// 商家可对处方类订单执行审核，通过 status 区分通过或驳回。
export const auditOrder = (orderId: number, status: number, reason?: string) => {
  return request.post(`/orders/${orderId}/audit`, { status, reason });
};

// 商家处理退款申请，status=1 通常表示同意。
export const processRefund = (orderId: number, status: number, remark?: string) => {
  return request.post(`/orders/${orderId}/refund/process`, { status, remark });
};

// 订单详情用于商家查看商品明细、审核信息和售后信息。
export const getOrderDetail = (orderId: number) => {
  return request.get<Order>(`/orders/${orderId}`);
};
