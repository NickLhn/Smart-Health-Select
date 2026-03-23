import request from './request';

// 上传文件到后端统一文件服务。
export const uploadFile = (file: File) => {
  const formData = new FormData();
  // 上传组件统一只把原始 File 透传给后端文件服务。
  formData.append('file', file);
  return request.post<string>('/file/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
