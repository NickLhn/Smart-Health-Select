import request from './request';

export interface MedicineQuery {
  page?: number;
  size?: number;
  keyword?: string;
  categoryId?: number;
  isPrescription?: number;
  status?: number;
}

export interface Medicine {
  id: number;
  name: string;
  categoryId: number;
  categoryName?: string;
  mainImage: string;
  price: number;
  stock: number;
  sales: number;
  isPrescription: number; // 0: OTC, 1: Rx
  indication: string;
  usageMethod: string;
  contraindication: string;
  expiryDate: string;
  productionDate: string;
  sellerId: number;
  sellerName?: string;
  status: number; // 1: 上架, 0: 下架
  createTime: string;
}

export interface PageResult<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

export interface Result<T> {
  code: number;
  message: string;
  data: T;
}

// 分页搜索药品 (管理端)
export const getAdminMedicineList = (params: MedicineQuery) => {
  return request.get<PageResult<Medicine>>('/medicine/admin/list', { params });
};

// 删除药品 (管理端)
export const deleteMedicineAdmin = (id: number) => {
  return request.delete(`/medicine/admin/${id}`);
};

// 修改药品状态 (管理端)
export const updateMedicineStatusAdmin = (id: number, status: number) => {
  return request.patch(`/medicine/admin/${id}/status?status=${status}`);
};

// 获取分类列表 (复用之前的或新建)
export interface Category {
  id: number;
  name: string;
  parentId: number;
  level: number;
  sort: number;
  icon?: string;
}

export const getCategoryList = () => {
  return request.get<Category[]>('/category/list');
};

export const addCategory = (data: Partial<Category>) => {
  return request.post('/category', data);
};

export const updateCategory = (data: Partial<Category>) => {
  return request.put('/category', data);
};

export const deleteCategory = (id: number) => {
  return request.delete(`/category/${id}`);
};
