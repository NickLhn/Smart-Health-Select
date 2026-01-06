import request from './request';

export interface CartAddDTO {
  medicineId: number;
  count: number;
}

export interface CartItemVO {
  id: number;
  medicineId: number;
  medicineName: string;
  medicineImage: string;
  price: number;
  count: number;
  stock: number;
}

export interface CartUpdateDTO {
  id: number;
  count: number;
}

export const addToCart = (data: CartAddDTO) => {
  return request.post('/cart/add', data);
};

export const updateCartCount = (data: CartUpdateDTO) => {
  return request.put('/cart/update', data);
};

export const getCartList = () => {
  return request.get<CartItemVO[]>('/cart/list');
};

export const deleteCartItems = (ids: number[]) => {
  return request.delete('/cart/delete', { data: ids });
};
