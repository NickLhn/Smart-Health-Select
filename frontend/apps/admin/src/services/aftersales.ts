import request from './request';

// 管理端售后管理接口与状态枚举。
export enum RefundStatus {
  PENDING = 0, // 待审核
  APPROVED = 1, // 审核通过
  REJECTED = 2, // 审核拒绝
}

// 售后类型。
export enum RefundType {
  ONLY_REFUND = 1, // 仅退款
  RETURN_REFUND = 2, // 退货退款
}

export interface RefundApply {
  id: number;
  orderId: number;
  userId: number;
  type: number;
  reason: string;
  amount: number;
  images?: string;
  originalOrderStatus: number;
  status: number;
  auditTime?: string;
  auditReason?: string;
  createTime: string;
  updateTime: string;
  // 关联字段由后端列表接口按需补充，前端不单独再查详情表。
  orderNo?: string;
  username?: string;
}

export interface RefundQuery {
  page?: number;
  size?: number;
  status?: number;
}

export interface RefundAuditParams {
  id: number;
  pass: boolean;
  auditReason?: string;
}

// 获取售后申请分页列表。
export const getRefundList = (params: RefundQuery) => {
  return request.get<any>('/aftersales/list', { params });
};

// 管理员或商家审核售后申请。
export const auditRefund = (data: RefundAuditParams) => {
  return request.post('/aftersales/audit', data);
};
