import request from './request';

// 用户端健康资讯查询接口。
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

// 获取资讯分页列表。
export const getArticlePage = (params: ArticleQueryParams) => {
  return request.get<PageResult<HealthArticle>>('/health/article/page', { params });
};

// 获取资讯详情。
export const getArticleDetail = (id: number) => {
  return request.get<HealthArticle>(`/health/article/${id}`);
};
