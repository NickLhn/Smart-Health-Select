import request from './request';

// 收藏夹相关接口。
export interface FavoriteItem {
  id: number;
  name: string;
  mainImage: string;
  price: number;
}

export interface FavoriteAddDTO {
  medicineId: number;
}

// 切换收藏状态：同一个接口同时处理收藏和取消收藏。
export const toggleFavorite = (data: FavoriteAddDTO) => {
  return request.post('/api/favorite/toggle', data);
};

// 检查某个药品是否已经被当前用户收藏。
export const checkFavorite = (medicineId: number) => {
  return request.get<boolean>(`/api/favorite/check/${medicineId}`);
};

// 获取当前用户的收藏列表。
export const getMyFavorites = () => {
  return request.get<any>('/api/favorite/list');
};
