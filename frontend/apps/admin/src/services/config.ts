import request from './request';

export interface SystemConfig {
  [key: string]: string;
}

export const getAllConfigs = () => {
  return request.get<SystemConfig>('/sys/config');
};

export const updateConfigs = (data: SystemConfig) => {
  return request.post<null>('/sys/config', data);
};
