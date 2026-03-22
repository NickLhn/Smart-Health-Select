import request from './request';

// 管理端商家审核与查询接口。
export interface Merchant {
  id: number;
  userId: number;
  shopName: string;
  shopLogo: string;
  description: string;
  address: string;
  licenseUrl: string;
  idCardFront: string;
  idCardBack: string;
  contactName: string;
  contactPhone: string;
  creditCode: string;
  auditStatus: number; // 0待审核 1审核通过 2审核驳回
  auditRemark: string;
  createTime: string;
  updateTime: string;
}

export interface MerchantQuery {
  page: number;
  size: number;
  keyword?: string;
  auditStatus?: number;
}

export interface PageResult<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

export interface Result<T> {
  code: number;
  message: string;
  data: T;
}

// 获取商家分页列表。
export const getMerchantList = (params: MerchantQuery) => {
  return request.get<PageResult<Merchant>>('/merchant/list', { params });
};

// 执行商家审核。
export const auditMerchant = (id: number, auditStatus: number, auditRemark?: string) => {
  return request.put('/merchant/audit', { id, auditStatus, auditRemark });
};

// 获取商家详情。
export const getMerchantDetail = (id: number) => {
  return request.get<Merchant>(`/merchant/${id}`);
};
