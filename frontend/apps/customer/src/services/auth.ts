import request from './request';

export interface LoginParams {
  username?: string;
  password?: string;
  mobile?: string;
  captcha?: string;
  loginType?: 'account' | 'mobile'; // Frontend specific to decide which fields to send or backend might handle it
  role?: string;
}

export interface RegisterParams {
  username?: string;
  password?: string;
  mobile: string;
  captcha: string;
}

export interface ResetPasswordParams {
  mobile: string;
  captcha: string;
  newPassword: string;
  role?: string;
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

export const logout = () => {
  // If backend has logout endpoint, call it. Otherwise just clear local storage.
  return Promise.resolve(); 
};

export const sendVerifyCode = (mobile: string) => {
  return request.post('/sms/send-code', null, { params: { phone: mobile } });
};
