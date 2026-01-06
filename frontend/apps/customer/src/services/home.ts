import request from './request';

export interface Banner {
  id: number;
  imageUrl: string;
  linkUrl: string;
}

export interface Category {
  id: number;
  name: string;
  icon: string;
  parentId: number;
  children?: Category[];
}

export interface Medicine {
  id: number;
  name: string;
  mainImage: string;
  price: number;
  stock: number;
  sales: number;
  specs: string; // Add specs if available in backend entity or DTO, otherwise might be missing
  description?: string;
}

export interface HealthArticle {
  id: number;
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

export const getHomeIndex = () => {
  return request.get<HomeIndexVO>('/home/index');
};
