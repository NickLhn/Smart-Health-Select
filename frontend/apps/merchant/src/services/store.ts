import request from './request';

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
}

export interface MerchantSettingDTO {
  businessStatus: number;
  businessHours: string;
  deliveryFee: number;
  minDeliveryAmount: number;
  notice: string;
}

/**
 * 获取我的店铺信息
 */
export async function getMyStore() {
  return request.get<Merchant>('/merchant/my-store');
}

/**
 * 商家入驻/更新信息
 */
export async function applyStore(data: MerchantApplyDTO) {
  return request.post<void>('/merchant/apply', data);
}

/**
 * 更新店铺运营设置
 */
export async function updateStoreSettings(data: MerchantSettingDTO) {
  return request.put<void>('/merchant/settings', data);
}
