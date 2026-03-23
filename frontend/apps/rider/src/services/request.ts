import Taro from '@tarojs/taro'

export const getApiBaseUrl = () => {
  if (process.env.TARO_ENV === 'h5') {
    return '/api'
  }

  // 小程序/真机环境走直连后端地址，和 H5 代理分开。
  // const PROD_API_URL = 'https://api.zhijianshangcheng.cn/api'
  const PROD_API_URL = 'http://39.108.166.216:8080/api'
  // const PROD_API_URL = 'http://localhost:8080/api'
  return PROD_API_URL
}

export const baseUrl = getApiBaseUrl()

interface Result<T = any> {
  code: number
  msg: string
  data: T
}

const request = async <T = any>(
  url: string, 
  method: 'GET' | 'POST' | 'PUT' | 'DELETE', 
  data?: any
): Promise<Result<T>> => {
  const token = Taro.getStorageSync('token')
  const header: any = {
    'Content-Type': 'application/json'
  }
  if (token) {
    // 骑手端本地 token 统一在请求层追加，页面不再单独处理。
    header['Authorization'] = `Bearer ${token}`
  }

  try {
    const res = await Taro.request({
      url: getApiBaseUrl() + url,
      method,
      data,
      header
    })

    if (res.statusCode === 401) {
      // token 失效时清空本地状态并强制跳回登录页。
      Taro.removeStorageSync('token')
      Taro.redirectTo({ url: '/pages/login/index' })
      return { code: 401, msg: '未登录', data: null as any }
    }
    
    // 某些异常情况下服务端可能返回空响应，这里统一兜底。
    if (!res || !res.data) {
        console.error('Request failed with empty response:', res)
        return { code: 500, msg: '服务器响应异常', data: null as any }
    }

    return res.data as Result<T>
  } catch (err) {
    console.error(err)
    Taro.showToast({ title: '网络请求失败', icon: 'none' })
    return { code: 500, msg: '网络错误', data: null as any }
  }
}

const requestService = {
  get: <T = any>(url: string, data?: any) => request<T>(url, 'GET', data),
  post: <T = any>(url: string, data?: any) => request<T>(url, 'POST', data),
  put: <T = any>(url: string, data?: any) => request<T>(url, 'PUT', data),
  delete: <T = any>(url: string, data?: any) => request<T>(url, 'DELETE', data)
}

export default requestService
