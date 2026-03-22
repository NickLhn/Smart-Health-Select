import request from './request';

// 商家店铺信息与入驻接口。
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
  legalPersonIdLast4?: string;
  legalPersonIdHash?: string;
  legalPersonAddress?: string;
  idCardAuthority?: string;
  idCardValidFrom?: string;
  idCardValidTo?: string;
  idCardValidLongTerm?: number;
  auditStatus: number; // 0待审核 1审核通过 2审核驳回
  auditRemark: string;
  createTime: string;
  updateTime: string;
  
  // 运营设置
  businessStatus?: number;
  businessHours?: string;
  deliveryFee?: number;
  minDeliveryAmount?: number;
  notice?: string;
}

export interface MerchantApplyDTO {
  shopName: string;
  shopLogo: string;
  description: string;
  address: string;
  licenseUrl: string;
  contactName: string;
  contactPhone: string;
  creditCode: string;
  idCardFront?: string;
  idCardBack?: string;
  legalPersonIdLast4?: string;
  legalPersonIdHash?: string;
  legalPersonAddress?: string;
  idCardAuthority?: string;
  idCardValidFrom?: string;
  idCardValidTo?: string;
  idCardValidLongTerm?: number;
}

export interface MerchantSettingDTO {
  businessStatus: number;
  businessHours: string;
  deliveryFee: number;
  minDeliveryAmount: number;
  notice: string;
}

// 获取当前登录商家的店铺资料与审核状态。
export async function getMyStore() {
  return request.get<Merchant>('/merchant/my-store');
}

// 商家首次入驻或补充入驻资料都走这个接口。
export async function applyStore(data: MerchantApplyDTO) {
  return request.post<void>('/merchant/apply', data);
}

// 更新营业状态、配送费、起送价等运营配置。
export async function updateStoreSettings(data: MerchantSettingDTO) {
  return request.put<void>('/merchant/settings', data);
}
