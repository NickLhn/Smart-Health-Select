import request from './request';

// 商家端商品与评价管理接口。
export interface Medicine {
  id: number;
  name: string;
  categoryId: number;
  categoryName?: string; // 列表查询时可能会返回
  mainImage: string;
  price: number;
  stock: number;
  sales: number;
  isPrescription: boolean | number;
  indication?: string;
  usageMethod?: string;
  contraindication?: string;
  expiryDate?: string;
  productionDate?: string;
  sellerId: number;
  status: number; // 1上架 0下架
  createTime?: string;
  updateTime?: string;
}

// 创建和更新商品时共用的数据结构。
export interface MedicineDTO {
  name: string;
  categoryId: number;
  mainImage: string;
  price: number;
  stock: number;
  isPrescription: number;
  indication?: string;
  usageMethod?: string;
  contraindication?: string;
  expiryDate?: string;
  productionDate?: string;
}

// 商品列表查询条件。
export interface MedicineQuery extends Record<string, any> {
  page?: number;
  size?: number;
  keyword?: string;
  categoryId?: number;
  status?: number;
}

// 通用分页返回结构。
export interface PageResult<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

export interface Category {
  id: number;
  name: string;
  parentId: number;
  level: number;
  sort: number;
  children?: Category[];
}

export interface MedicineComment {
  id: number;
  medicineId: number;
  userId: number;
  userName: string;
  userAvatar?: string;
  star: number;
  content: string;
  reply?: string; // 商家回复内容
  images?: string;
  createTime: string;
}

// 商家查看商品评价列表，并支持分页。
export async function getMerchantCommentList(page: number = 1, size: number = 10) {
  return request.get<PageResult<MedicineComment>>('/medicine/comment/merchant', {
    params: { page, size }
  });
}

// 回复评价时只提交回复内容，后端按 commentId 绑定到评价记录。
export async function replyComment(commentId: number, content: string) {
  return request.post(`/medicine/comment/reply/${commentId}`, { reply: content });
}

// 获取当前商家自己的商品列表。
export async function getMedicineList(params: MedicineQuery) {
  return request.get<PageResult<Medicine>>('/medicine/merchant/list', {
    params,
  });
}

// 获取单个商品详情，编辑页会复用这个接口。
export async function getMedicineDetail(id: number) {
  return request.get<Medicine>(`/medicine/${id}`);
}

// 创建商品。
export async function createMedicine(data: MedicineDTO) {
  return request.post<void>('/medicine', data);
}

// 更新商品。
export async function updateMedicine(id: number, data: MedicineDTO) {
  return request.put<void>(`/medicine/${id}`, data);
}

// 更新商品上架/下架状态。
export async function updateMedicineStatus(id: number, status: number) {
  return request.patch<void>(`/medicine/${id}/status`, null, {
    params: { status },
  });
}

// 获取分类列表，供商品发布和筛选复用。
export async function getCategoryList() {
  return request.get<Category[]>('/category/list');
}
