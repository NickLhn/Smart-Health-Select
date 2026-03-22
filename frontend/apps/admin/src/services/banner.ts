import request from './request';

// 管理端轮播图管理接口。
export interface Banner {
  id: number;
  title: string;
  imageUrl: string;
  linkUrl: string;
  sort: number;
  status: number; // 1: 启用, 0: 禁用
  createTime: string;
  updateTime: string;
}

export interface BannerQuery {
  page?: number;
  size?: number;
}

export interface PageResult<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

// 分页查询轮播图列表。
export const getBannerList = (params: BannerQuery) => {
  return request.get<PageResult<Banner>>('/admin/banner/list', { params });
};

// 新增轮播图。
export const addBanner = (data: Partial<Banner>) => {
  return request.post('/admin/banner', data);
};

// 更新轮播图。
export const updateBanner = (id: number, data: Partial<Banner>) => {
  return request.put(`/admin/banner/${id}`, data);
};

// 删除轮播图。
export const deleteBanner = (id: number) => {
  return request.delete(`/admin/banner/${id}`);
};
