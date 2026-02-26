import request from './request';

// 药品数据接口
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

// 创建/更新 DTO
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

// 查询参数
export interface MedicineQuery extends Record<string, any> {
  page?: number;
  size?: number;
  keyword?: string;
  categoryId?: number;
  status?: number;
}

// 分页结果
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

export async function getMerchantCommentList(page: number = 1, size: number = 10) {
  return request.get<PageResult<MedicineComment>>('/medicine/comment/merchant', {
    params: { page, size }
  });
}

export async function replyComment(commentId: number, content: string) {
  return request.post(`/medicine/comment/reply/${commentId}`, { reply: content });
}

/**
 * 分页获取药品列表
 */
export async function getMedicineList(params: MedicineQuery) {
  return request.get<PageResult<Medicine>>('/medicine/merchant/list', {
    params,
  });
}

/**
 * 获取药品详情
 */
export async function getMedicineDetail(id: number) {
  return request.get<Medicine>(`/medicine/${id}`);
}

/**
 * 创建药品
 */
export async function createMedicine(data: MedicineDTO) {
  return request.post<void>('/medicine', data);
}

/**
 * 更新药品
 */
export async function updateMedicine(id: number, data: MedicineDTO) {
  return request.put<void>(`/medicine/${id}`, data);
}

/**
 * 更新药品状态 (上下架)
 */
export async function updateMedicineStatus(id: number, status: number) {
  return request.patch<void>(`/medicine/${id}/status`, null, {
    params: { status },
  });
}

/**
 * 获取分类树/列表
 * (假设后端有这个接口，通常在 CategoryController)
 */
export async function getCategoryList() {
  // 暂时假设有一个获取所有分类的接口，具体路径可能需要确认
  return request.get<Category[]>('/category/list');
}
