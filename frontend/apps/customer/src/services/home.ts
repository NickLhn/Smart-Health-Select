import request from './request';

// 首页聚合接口返回的数据模型。
export interface Banner {
  id: string;
  imageUrl: string;
  linkUrl: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  parentId: string;
  children?: Category[];
}

export interface Medicine {
  id: string;
  name: string;
  mainImage: string;
  price: number;
  stock: number;
  sales: number;
  // 规格字段依赖后端返回，若后端未填充则前端需要兼容空值。
  specs: string;
  description?: string;
}

export interface HealthArticle {
  id: string;
  title: string;
  category: string;
  summary: string;
  coverImage: string;
  createTime: string;
}

export interface HomeIndexVO {
  banners: Banner[];
  categories: Category[];
  hotMedicines: Medicine[];
  recommendMedicines: Medicine[];
  healthArticles?: HealthArticle[];
}

// 首页使用一个聚合接口，减少首屏并发请求数量。
export const getHomeIndex = () => {
  return request.get<HomeIndexVO>('/home/index');
};
