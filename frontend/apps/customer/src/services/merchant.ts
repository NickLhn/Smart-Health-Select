import request from './request';

export interface Merchant {
  id: number;
  userId: number;
  shopName: string;
  logo?: string;
  description?: string;
  status: number;
  createTime: string;
}

// 获取商家详情 (根据userId)
export const getMerchantByUserId = (userId: number) => {
  return request.get<Merchant>(`/merchant/user/${userId}`);
};
