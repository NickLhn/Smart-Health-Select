import request from './request';

export interface OrderCreateFromCartDTO {
  cartItemIds: number[];
  addressId: number;
  userCouponId?: number;
  patientId?: number;
  prescriptionImage?: string;
}

export const createOrderFromCart = (data: OrderCreateFromCartDTO) => {
  return request.post('/orders/createFromCart', data);
};

export const calculateFreight = (data: OrderCreateFromCartDTO) => {
  return request.post<number>('/orders/calculateFreight', data);
};

export interface OrderCommentDTO {
  orderId: number;
  star: number;
  content: string;
  images?: string;
}

export const commentOrder = (data: OrderCommentDTO) => {
  return request.post<boolean>('/orders/comment', data);
};

export const payOrder = (orderId: number) => {
    return request.post(`/orders/${orderId}/pay`);
};

export const cancelOrder = (orderId: number) => {
  return request.post(`/orders/${orderId}/cancel`);
};

export const applyRefund = (orderId: number, reason: string) => {
  return request.post(`/orders/${orderId}/refund`, { reason });
};

export interface OrderQueryDTO {
  status?: number;
  auditStatus?: number;
  page?: number;
  size?: number;
}

export interface Order {
  id: number;
  orderNo: string;
  medicineName?: string;
  medicineImage?: string;
  price?: number;
  quantity?: number;
  totalAmount: number;
  payAmount: number;
  status: number; // 0:待支付 1:待发货 2:已发货 3:已完成 4:售后中 5:已退款 -1:已取消 7:待审核
  createTime: string;
  auditStatus?: number; // 0-无需审核 1-待审核 2-审核通过 3-审核拒绝
  auditReason?: string;
  payTime?: string;
  deliveryTime?: string;
  finishTime?: string;
  receiverName?: string;
  receiverPhone?: string;
  receiverAddress?: string;
  couponAmount?: number;
  medicineId?: number;
  commentStatus?: number; // 0:未评价 1:已评价
}

export interface PageResult<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

export const getOrderList = (params: OrderQueryDTO) => {
  return request.get<PageResult<Order>>('/orders/list', { params });
};

export const getOrderDetail = (id: number) => {
  return request.get<Order>(`/orders/${id}`);
};

export const confirmReceipt = (id: number) => {
  return request.post(`/orders/${id}/receive`);
};
