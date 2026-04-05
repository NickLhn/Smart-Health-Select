import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// 定义接口返回格式
interface Result<T = any> {
  code: number | string;
  message: string;
  data: T;
}

// 管理端统一请求层：
// 负责 token 注入、统一业务错误处理，以及对 axios 做轻量封装。
class Request {
  private instance: AxiosInstance;

  constructor(config: AxiosRequestConfig) {
    this.instance = axios.create(config);

    // 请求拦截器
    this.instance.interceptors.request.use(
      (config) => {
        // 管理端依赖本地 token 做鉴权，请求发出前统一补头。
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
        const normalizedCode = Number(code);
        // 业务码非 200 时直接进入异常流，页面只需要处理成功或失败提示。
        if (normalizedCode === 200) {
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
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // 统一导出常见 HTTP 方法，调用方不直接接触 axios 实例。
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
