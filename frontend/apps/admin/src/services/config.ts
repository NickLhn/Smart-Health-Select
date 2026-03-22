import request from './request';

// 系统配置接口。
export interface SystemConfig {
  [key: string]: string;
}

// 获取全部系统配置。
export const getAllConfigs = () => {
  return request.get<SystemConfig>('/sys/config');
};

// 批量更新系统配置。
export const updateConfigs = (data: SystemConfig) => {
  return request.post<null>('/sys/config', data);
};
