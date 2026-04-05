import request from './request';

// 用户端药品与评价查询接口。
export interface Medicine {
  id: string;
  name: string;
  categoryName?: string;
  categoryId?: string;
  price: number;
  stock: number;
  sales: number;
  mainImage: string;
  // 规格字段有些场景后端不返回，因此前端按可选值处理。
  specs?: string;
  description?: string;
  indication?: string;
  usageMethod?: string;
  contraindication?: string;
  sellerId?: string;
  sellerName?: string;
  status?: number;
  createTime?: string;
}

export interface Category {
  id: string;
  name: string;
  parentId: string;
  icon?: string;
  children?: Category[];
}

export interface MedicineQuery {
  page?: number;
  size?: number;
  categoryId?: number;
  keyword?: string;
  // 前端约定排序值，再在调用前转换为后端识别的 sortBy/sortOrder。
  sort?: string;
  sellerId?: number;
}

export interface PageResult<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

// 获取药品列表，支持分页、搜索、分类筛选和排序。
export const getMedicineList = (params: MedicineQuery) => {
  // 把前端的排序枚举转换为后端更通用的字段名 + 顺序格式。
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
  id: string;
  medicineId: string;
  userId: string;
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

export const getMedicineCommentList = (medicineId: string, page: number = 1, size: number = 10) => {
  return request.get<PageResult<MedicineComment>>(`/medicine/comment/list/${medicineId}`, {
    params: { page, size }
  });
};

export const getMyCommentList = (page: number = 1, size: number = 10) => {
  return request.get<PageResult<MedicineComment>>('/medicine/comment/my', {
    params: { page, size }
  });
};

// 获取药品分类树/列表，首页和筛选页都会复用。
export const getCategoryList = () => {
  return request.get<Category[]>('/category/list');
};

// 药品详情页通过这个接口展示说明、禁忌、商家等完整信息。
export const getMedicineDetail = (id: string) => {
  return request.get<Medicine>(`/medicine/${id}`);
};
