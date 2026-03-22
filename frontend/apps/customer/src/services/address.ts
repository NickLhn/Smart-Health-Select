import request from './request';

// 用户地址管理接口。
export interface UserAddress {
  id: number;
  userId: number;
  receiverName: string;
  receiverPhone: string;
  province: string;
  city: string;
  region: string;
  detailAddress: string;
  isDefault: number; // 0 or 1
  createTime?: string;
  updateTime?: string;
}

export interface AddressAddDTO {
  receiverName: string;
  receiverPhone: string;
  province: string;
  city: string;
  region: string;
  detailAddress: string;
  isDefault?: number;
}

export interface AddressUpdateDTO extends AddressAddDTO {
  id: number;
}

// 获取当前用户的收货地址列表。
export const getAddressList = () => {
  return request.get<UserAddress[]>('/user/address/list');
};

// 新增地址。
export const addAddress = (data: AddressAddDTO) => {
  return request.post('/user/address/add', data);
};

// 更新地址。
export const updateAddress = (data: AddressUpdateDTO) => {
  return request.put('/user/address/update', data);
};

// 删除地址。
export const deleteAddress = (id: number) => {
  return request.delete(`/user/address/delete/${id}`);
};

// 设置默认地址。
export const setDefaultAddress = (id: number) => {
  return request.put(`/user/address/default/${id}`);
};
