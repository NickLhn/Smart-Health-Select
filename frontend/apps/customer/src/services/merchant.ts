import request from './request';

// 用户端商家查询接口。
export interface Merchant {
  id: number;
  userId: number;
  shopName: string;
  logo?: string;
  description?: string;
  status: number;
  createTime: string;
}

// 根据商家用户 ID 获取店铺详情，常用于商品详情页跳店铺页。
export const getMerchantByUserId = (userId: number) => {
  return request.get<Merchant>(`/merchant/user/${userId}`);
};
