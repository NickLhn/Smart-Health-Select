import request from './request';

// 用户端认证接口：
// 兼容账号密码登录、手机号验证码登录、注册和找回密码。
export interface LoginParams {
  username?: string;
  password?: string;
  mobile?: string;
  captcha?: string;
  // 前端用这个字段区分当前表单形态，后端按实际参数决定认证方式。
  loginType?: 'account' | 'mobile';
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

// 登录接口同时服务用户端、商家端、管理端，通过参数决定登录方式。
export const login = (params: LoginParams) => {
  return request.post<LoginResult>('/auth/login', params);
};

export const register = (params: RegisterParams) => {
  return request.post('/auth/register', params);
};

export const resetPassword = (params: ResetPasswordParams) => {
  return request.post('/auth/reset-password', params);
};

// 用户端退出登录由前端主动清理本地 token，这里保留统一 service 入口。
export const logout = () => {
  return Promise.resolve(); 
};

// 统一使用短信服务发送验证码，后端要求手机号参数名为 phone。
export const sendVerifyCode = (mobile: string) => {
  return request.post('/sms/send-code', null, { params: { phone: mobile } });
};
