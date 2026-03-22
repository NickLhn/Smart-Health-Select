import request from './request';

// 用户端订单相关接口：
// 包括从购物车下单、支付、取消、评价、售后申请以及订单查询。
export interface OrderCreateFromCartDTO {
  cartItemIds: number[];
  addressId: number;
  userCouponId?: number;
  patientId?: number;
  prescriptionImage?: string;
}

// 购物车提交后可能按店铺拆成多个订单，因此返回值是订单 ID 列表。
export const createOrderFromCart = (data: OrderCreateFromCartDTO) => {
  return request.post('/orders/createFromCart', data);
};

// 下单前先试算运费，前端据此展示最终应付金额。
export const calculateFreight = (data: OrderCreateFromCartDTO) => {
  return request.post<number>('/orders/calculateFreight', data);
};

export interface OrderCommentDTO {
  orderId: number;
  star: number;
  content: string;
  images?: string;
}

// 用户完成订单后通过订单接口直接提交评价。
export const commentOrder = (data: OrderCommentDTO) => {
  return request.post<boolean>('/orders/comment', data);
};

// 当前项目使用模拟支付，便于教学演示完整订单流转。
export const payOrder = (orderId: number) => {
    return request.post(`/orders/${orderId}/pay`);
};

// 取消订单通常发生在待支付或特定可取消状态。
export const cancelOrder = (orderId: number) => {
  return request.post(`/orders/${orderId}/cancel`);
};

// 简化后的退款申请只要求前端提交退款原因。
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

// 获取当前登录用户的订单分页列表。
export const getOrderList = (params: OrderQueryDTO) => {
  return request.get<PageResult<Order>>('/orders/list', { params });
};

// 订单详情页会基于这个接口展示商品、地址、状态和审核信息。
export const getOrderDetail = (id: number) => {
  return request.get<Order>(`/orders/${id}`);
};

// 订单完成前最后一步，由用户主动确认收货。
export const confirmReceipt = (id: number) => {
  return request.post(`/orders/${id}/receive`);
};
