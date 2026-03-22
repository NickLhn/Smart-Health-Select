import request from './request';

// 管理端健康资讯管理接口。
export interface HealthArticle {
  id: number;
  title: string;
  category: string;
  summary: string;
  content: string;
  coverImage: string;
  status: number;
  views: number;
  createTime: string;
  updateTime: string;
}

export interface ArticleQueryParams {
  page: number;
  size: number;
  title?: string;
  category?: string;
}

export interface PageResult<T> {
  records: T[];
  total: number;
  current: number;
  size: number;
}

// 获取资讯分页列表。
export const getArticlePage = (params: ArticleQueryParams) => {
  return request.get<PageResult<HealthArticle>>('/health/article/page', { params });
};

// 获取资讯详情。
export const getArticleById = (id: number) => {
  return request.get<HealthArticle>(`/health/article/${id}`);
};

// 新增资讯。
export const addArticle = (data: Partial<HealthArticle>) => {
  return request.post<boolean>('/health/article', data);
};

// 修改资讯。
export const updateArticle = (data: Partial<HealthArticle>) => {
  return request.put<boolean>('/health/article', data);
};

// 删除资讯。
export const deleteArticle = (id: number) => {
  return request.delete<boolean>(`/health/article/${id}`);
};
