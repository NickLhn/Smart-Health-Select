import request from './request';

// 商家端认证与账户相关接口。
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

// 登录、注册、找回密码复用统一认证接口，通过 role 限制登录入口身份。
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
  return request.post('/user/password', params);
};

// 商家端退出由前端清理本地凭证完成，这里维持统一 service 结构。
export const logout = () => {
  return Promise.resolve(); 
};

// 发送短信验证码时显式传递 phone 参数，和后端控制器保持一致。
export const sendVerifyCode = (mobile: string) => {
  return request.post('/sms/send-code', null, { params: { phone: mobile } });
};
