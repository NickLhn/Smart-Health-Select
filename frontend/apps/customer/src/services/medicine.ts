import request from './request';

export interface Medicine {
  id: number;
  name: string;
  categoryName?: string;
  categoryId?: number;
  price: number;
  stock: number;
  sales: number;
  mainImage: string;
  specs?: string; // made optional
  description?: string;
  indication?: string; // 适应症
  usageMethod?: string; // 用法用量
  contraindication?: string; // 禁忌
  sellerId?: number;
  sellerName?: string;
  status?: number;
  createTime?: string;
}

export interface Category {
  id: number;
  name: string;
  parentId: number;
  icon?: string;
  children?: Category[];
}

export interface MedicineQuery {
  page?: number;
  size?: number;
  categoryId?: number;
  keyword?: string;
  sort?: string; // default, price_asc, price_desc, sales_desc
  sellerId?: number;
}

export interface PageResult<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

// 获取药品列表（分页+搜索+筛选）
export const getMedicineList = (params: MedicineQuery) => {
  // Transform sort param to backend expected format
  const { sort, ...rest } = params;
  const queryParams: any = { ...rest };

  if (sort) {
    if (sort === 'price_asc') {
      queryParams.sortBy = 'price';
      queryParams.sortOrder = 'asc';
    } else if (sort === 'price_desc') {
      queryParams.sortBy = 'price';
      queryParams.sortOrder = 'desc';
    } else if (sort === 'sales_desc') {
      queryParams.sortBy = 'sales';
      queryParams.sortOrder = 'desc';
    }
  }

  return request.get<PageResult<Medicine>>('/medicine/list', { params: queryParams });
};

export interface MedicineComment {
  id: number;
  medicineId: number;
  userId: number;
  userName: string;
  userAvatar?: string;
  star: number;
  content: string;
  images?: string;
  createTime: string;
  medicineName?: string;
  medicineImage?: string;
  reply?: string;
  replyTime?: string;
}

export const getMedicineCommentList = (medicineId: number, page: number = 1, size: number = 10) => {
  return request.get<PageResult<MedicineComment>>(`/medicine/comment/list/${medicineId}`, {
    params: { page, size }
  });
};

export const getMyCommentList = (page: number = 1, size: number = 10) => {
  return request.get<PageResult<MedicineComment>>('/medicine/comment/my', {
    params: { page, size }
  });
};

// 获取分类列表
export const getCategoryList = () => {
  return request.get<Category[]>('/category/list');
};

// 获取药品详情
export const getMedicineDetail = (id: number) => {
  return request.get<Medicine>(`/medicine/${id}`);
};
