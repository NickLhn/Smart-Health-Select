import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// 定义接口返回格式
interface Result<T = any> {
  code: number;
  message: string;
  data: T;
}

// 商家端统一请求封装：
// 除了 token 注入和错误处理外，还额外负责 401 时自动回登录页。
class Request {
  private instance: AxiosInstance;

  constructor(config: AxiosRequestConfig) {
    this.instance = axios.create(config);

    // 请求拦截器
    this.instance.interceptors.request.use(
      (config) => {
        // 商家端所有业务接口默认都携带 token。
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response: AxiosResponse<Result>) => {
        const { code, message, data } = response.data;
        // 后端约定 code=200 为业务成功，其他情况按异常处理。
        if (code === 200) {
          return response;
        } else {
          // 处理业务错误
          console.error(`Error ${code}: ${message}`);
          return Promise.reject(new Error(message));
        }
      },
      (error) => {
        // 处理网络错误
        console.error('Network Error:', error);
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data:', error.response.data);
            
            // 如果 token 过期或无效，统一清空本地状态并跳回登录页。
            if (error.response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                if (!window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
      }
    );
  }

  // 暴露统一的 HTTP 方法，页面和 service 文件只关注业务参数。
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<Result<T>> {
    return this.instance.get(url, config).then((res) => res.data);
  }

  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<Result<T>> {
    return this.instance.post(url, data, config).then((res) => res.data);
  }

  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<Result<T>> {
    return this.instance.put(url, data, config).then((res) => res.data);
  }

  patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<Result<T>> {
    return this.instance.patch(url, data, config).then((res) => res.data);
  }

  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<Result<T>> {
    return this.instance.delete(url, config).then((res) => res.data);
  }
}

export default new Request({
  baseURL: '/api',
  timeout: 10000,
});
