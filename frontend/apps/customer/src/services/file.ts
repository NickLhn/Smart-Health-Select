import request from './request';

// 上传文件到统一文件服务，常用于头像、处方图和证件图。
export const uploadFile = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return request.post<string>('/file/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
