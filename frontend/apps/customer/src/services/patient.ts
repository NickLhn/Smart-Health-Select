import request from './request';

// 就诊人相关接口，主要服务于处方药下单场景。
export interface Patient {
  id: number;
  userId: number;
  name: string;
  idCard: string;
  idCardFront?: string;
  idCardBack?: string;
  phone: string;
  gender: number;
  birthday: string;
  isDefault: number;
}

export interface PatientAddDTO {
  name: string;
  idCard: string;
  idCardFront?: string;
  idCardBack?: string;
  phone: string;
  gender?: number;
  birthday?: string;
  isDefault?: number;
}

export interface PatientUpdateDTO extends PatientAddDTO {
  id: number;
}

// 获取当前用户的就诊人列表。
export const getPatientList = () => {
  return request.get<Patient[]>('/user/patient/list');
};

// 新增就诊人。
export const addPatient = (data: PatientAddDTO) => {
  return request.post('/user/patient/add', data);
};

// 更新就诊人信息。
export const updatePatient = (data: PatientUpdateDTO) => {
  return request.put('/user/patient/update', data);
};

// 删除指定就诊人。
export const deletePatient = (id: number) => {
  return request.delete(`/user/patient/delete/${id}`);
};
