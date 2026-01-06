import request from './request';

export interface UserCoupon {
  id: number;
  couponId: number;
  name: string;
  amount: number;
  minPoint: number;
  startTime: string;
  endTime: string;
  useStatus: number; // 0:未使用 1:已使用 2:已过期
}

// 获取可领取的优惠券列表
export const getAvailableCoupons = () => {
  return request.get<UserCoupon[]>('/marketing/coupon/list');
};

// 获取我的优惠券列表
export const getMyCoupons = (status?: number) => {
  return request.get<UserCoupon[]>('/marketing/user-coupon/my', { params: { status } });
};

// 领取优惠券
export const receiveCoupon = (couponId: number) => {
  return request.post(`/marketing/user-coupon/receive/${couponId}`);
};
