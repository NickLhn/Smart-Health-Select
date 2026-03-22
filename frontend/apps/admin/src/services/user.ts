import request from './request';

// 管理端用户管理接口。
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

// 获取用户分页列表。
export const getUserList = (params: UserQuery) => {
  return request.get<{ records: User[]; total: number }>('/user/admin/list', { params });
};

// 更新用户状态，用于禁用或恢复账号。
export const updateUserStatus = (id: number, status: number) => {
  return request.patch(`/user/admin/${id}/status`, null, { params: { status } });
};
