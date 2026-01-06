import request from './request';

export interface LoginParams {
  username?: string;
  password?: string;
  role?: string;
}

export interface RegisterParams {
  username?: string;
  password?: string;
  mobile: string;
  role: 'MERCHANT';
}

export interface ResetPasswordParams {
  mobile: string;
  captcha: string;
  newPassword: string;
  role?: string;
}

export interface PasswordUpdateParams {
  oldPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export interface UserInfo {
  id: number;
  username: string;
  nickname?: string;
  avatar?: string;
  role?: string;
}

export interface LoginResult {
  token: string;
  userInfo: UserInfo;
}

export const login = (params: LoginParams) => {
  return request.post<LoginResult>('/auth/login', params);
};

export const register = (params: RegisterParams) => {
  return request.post('/auth/register', params);
};

export const resetPassword = (params: ResetPasswordParams) => {
  return request.post('/auth/reset-password', params);
};

export const updatePassword = (params: PasswordUpdateParams) => {
  return request.put('/user/password', params);
};

export const logout = () => {
  return Promise.resolve(); 
};

export const sendVerifyCode = (mobile: string) => {
  return request.post('/sms/send-code', null, { params: { phone: mobile } });
};
