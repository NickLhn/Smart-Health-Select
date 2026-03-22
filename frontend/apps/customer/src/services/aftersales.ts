import request from './request';

// 用户端售后申请接口与状态枚举。
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

// 用户提交售后申请。
export const applyRefund = (data: RefundApplyDTO) => {
  return request.post('/aftersales/apply', data);
};
