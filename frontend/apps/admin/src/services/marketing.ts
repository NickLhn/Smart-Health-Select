import request from './request';

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

export const getCouponPage = (params: CouponQueryDTO) => {
  return request.get<PageResult<Coupon>>('/marketing/coupon/page', { params });
};

export const createCoupon = (data: CouponCreateDTO) => {
  return request.post('/marketing/coupon/create', data);
};
