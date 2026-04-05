import request from './request';

// 购物车相关接口。
export interface CartAddDTO {
  medicineId: string;
  count: number;
}

export interface CartItemVO {
  id: string;
  medicineId: string;
  medicineName: string;
  medicineImage: string;
  price: number;
  count: number;
  stock: number;
}

export interface CartUpdateDTO {
  id: string;
  count: number;
}

// 加入购物车时传入药品 ID 和数量。
export const addToCart = (data: CartAddDTO) => {
  return request.post('/cart/add', data);
};

// 修改购物车数量时直接按购物车项 ID 更新。
export const updateCartCount = (data: CartUpdateDTO) => {
  return request.put('/cart/update', data);
};

// 购物车页进入时拉取当前用户的全部购物车项。
export const getCartList = () => {
  return request.get<CartItemVO[]>('/cart/list');
};

// 删除接口支持批量删除，因此参数是购物车项 ID 数组。
export const deleteCartItems = (ids: string[]) => {
  return request.delete('/cart/delete', { data: ids });
};
