import request from './request';

// 售后申请状态
export enum RefundStatus {
  PENDING = 0, // 待审核
  APPROVED = 1, // 审核通过
  REJECTED = 2, // 审核拒绝
}

// 售后申请类型
export enum RefundType {
  ONLY_REFUND = 1, // 仅退款
  RETURN_REFUND = 2, // 退货退款
}

export interface RefundApplyDTO {
  orderId: number;
  type: number;
  reason: string;
  amount: number;
  images?: string;
}

export interface RefundApply {
  id: number;
  orderId: number;
  userId: number;
  type: number;
  reason: string;
  amount: number;
  images?: string;
  status: number;
  auditTime?: string;
  auditReason?: string;
  createTime: string;
  updateTime: string;
}

// 申请售后
export const applyRefund = (data: RefundApplyDTO) => {
  return request.post('/aftersales/apply', data);
};

// 获取我的售后列表
export const getMyRefundList = (params: any) => {
  return request.get<any>('/aftersales/my-list', { params });
};
