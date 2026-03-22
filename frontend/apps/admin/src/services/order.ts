import request from './request';

// 管理端订单管理接口。
export interface OrderQueryDTO {
  page: number;
  size: number;
  status?: number;
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
  receiverName?: string;
  receiverPhone?: string;
  receiverAddress?: string;
  sellerId?: number;
  userId?: number;
  auditStatus?: number;
  auditReason?: string;
  payTime?: string;
  deliveryTime?: string;
  finishTime?: string;
  couponAmount?: number;
  prescriptionImage?: string;
}

export interface PageResult<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

// 获取管理端订单列表。
export const getAdminOrderList = (params: OrderQueryDTO) => {
  return request.get<PageResult<Order>>('/orders/admin/list', { params });
};

export interface OrderAuditDTO {
  orderId: number;
  pass: boolean;
  reason?: string;
}

// 审核处方或待审核订单。
export const auditOrder = (data: OrderAuditDTO) => {
  return request.post('/orders/audit', data);
};
