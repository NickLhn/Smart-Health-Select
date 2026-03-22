import request from './request';

// 上传文件到后端文件服务，供商品图、证件图等复用。
export const uploadFile = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return request.post<string>('/file/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
