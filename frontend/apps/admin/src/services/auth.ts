import request from './request';

// 管理端认证与账户相关接口。
export interface LoginParams {
  username?: string;
  password?: string;
  role?: string;
}

export interface RegisterParams {
  username?: string;
  password?: string;
  mobile: string;
  role: 'ADMIN';
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

// 登录、注册、重置密码都走统一的用户认证接口，只通过 role 区分端侧身份。
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

// 当前项目的退出登录由前端本地清 token 完成，这里保留统一调用形式。
export const logout = () => {
  return Promise.resolve(); 
};

// 验证码接口统一复用短信服务，后端按手机号参数发送。
export const sendVerifyCode = (mobile: string) => {
  return request.post('/sms/send-code', null, { params: { phone: mobile } });
};
