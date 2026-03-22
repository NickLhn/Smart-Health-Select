import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// 定义接口返回格式
interface Result<T = any> {
  code: number;
  message: string;
  data: T;
}

// 用户端统一请求封装：
// 负责追加 token、统一处理业务码，并把 axios 细节隔离在服务层内部。
class Request {
  private instance: AxiosInstance;

  constructor(config: AxiosRequestConfig) {
    this.instance = axios.create(config);

    // 请求拦截器
    this.instance.interceptors.request.use(
      (config) => {
        // 有登录态时自动补充 Bearer Token，避免每个接口重复写鉴权逻辑。
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
        // 约定 code=200 代表业务成功，其余情况一律抛出错误给页面层处理。
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
        return Promise.reject(error);
      }
    );
  }

  // get/post/put/delete 统一只返回业务层的 Result 结构，简化调用方写法。
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<Result<T>> {
    return this.instance.get(url, config).then((res) => res.data);
  }

  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<Result<T>> {
    return this.instance.post(url, data, config).then((res) => res.data);
  }

  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<Result<T>> {
    return this.instance.put(url, data, config).then((res) => res.data);
  }

  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<Result<T>> {
    return this.instance.delete(url, config).then((res) => res.data);
  }
}

export default new Request({
  baseURL: '/api',
  timeout: 10000,
});
