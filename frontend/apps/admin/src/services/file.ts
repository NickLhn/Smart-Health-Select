import request from './request';

// 上传文件到后端统一文件服务。
export const uploadFile = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return request.post<string>('/file/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
