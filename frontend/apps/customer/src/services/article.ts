import request from './request';

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

export interface PageResult<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

export interface ArticleQueryParams {
  page?: number;
  size?: number;
  title?: string;
  category?: string;
  status?: number;
}

export const getArticlePage = (params: ArticleQueryParams) => {
  return request.get<PageResult<HealthArticle>>('/health/article/page', { params });
};

export const getArticleDetail = (id: number) => {
  return request.get<HealthArticle>(`/health/article/${id}`);
};
