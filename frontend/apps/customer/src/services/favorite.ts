import request from './request';

export interface FavoriteItem {
  id: number;
  name: string;
  mainImage: string;
  price: number;
}

export interface FavoriteAddDTO {
  medicineId: number;
}

// 切换收藏状态 (收藏/取消收藏)
export const toggleFavorite = (data: FavoriteAddDTO) => {
  return request.post('/api/favorite/toggle', data);
};

// 检查是否已收藏
export const checkFavorite = (medicineId: number) => {
  return request.get<boolean>(`/api/favorite/check/${medicineId}`);
};

// 获取我的收藏列表
export const getMyFavorites = () => {
  return request.get<any>('/api/favorite/list');
};
