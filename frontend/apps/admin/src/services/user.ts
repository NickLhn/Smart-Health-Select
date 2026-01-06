import request from './request';

export interface User {
  id: number;
  username: string;
  nickname: string;
  mobile: string;
  avatar: string;
  role: string;
  status: number;
  createTime: string;
}

export interface UserQuery {
  page: number;
  size: number;
  keyword?: string;
  role?: string;
  status?: number;
}

export const getUserList = (params: UserQuery) => {
  return request.get<{ records: User[]; total: number }>('/user/admin/list', { params });
};

export const updateUserStatus = (id: number, status: number) => {
  return request.patch(`/user/admin/${id}/status`, null, { params: { status } });
};
