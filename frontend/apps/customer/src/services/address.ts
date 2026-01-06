import request from './request';

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

export const getAddressList = () => {
  return request.get<UserAddress[]>('/user/address/list');
};

export const addAddress = (data: AddressAddDTO) => {
  return request.post('/user/address/add', data);
};

export const updateAddress = (data: AddressUpdateDTO) => {
  return request.put('/user/address/update', data);
};

export const deleteAddress = (id: number) => {
  return request.delete(`/user/address/delete/${id}`);
};

export const setDefaultAddress = (id: number) => {
  return request.put(`/user/address/default/${id}`);
};
