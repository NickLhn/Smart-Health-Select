import request from './request';

// 管理端优惠券管理接口。
export interface Coupon {
  id: number;
  name: string;
  type: number; // 0:全场通用 1:指定分类 2:指定商品
  minPoint: number;
  amount: number;
  perLimit: number;
  totalCount: number;
  receiveCount: number;
  useCount: number;
  status: number; // 1:生效 0:失效
  startTime: string;
  endTime: string;
  createTime?: string;
}

export interface CouponCreateDTO {
  name: string;
  type: number;
  minPoint: number;
  amount: number;
  perLimit: number;
  totalCount: number;
  startTime: string;
  endTime: string;
}

export interface CouponQueryDTO {
  page?: number;
  size?: number;
  name?: string;
  type?: number;
  status?: number;
}

export interface PageResult<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

// 优惠券分页查询。
export const getCouponPage = (params: CouponQueryDTO) => {
  return request.get<PageResult<Coupon>>('/marketing/coupon/page', { params });
};

// 创建优惠券。
export const createCoupon = (data: CouponCreateDTO) => {
  return request.post('/marketing/coupon/create', data);
};
