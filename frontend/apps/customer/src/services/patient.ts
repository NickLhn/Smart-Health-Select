import request from './request';

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

export const getPatientList = () => {
  return request.get<Patient[]>('/user/patient/list');
};

export const addPatient = (data: PatientAddDTO) => {
  return request.post('/user/patient/add', data);
};

export const updatePatient = (data: PatientUpdateDTO) => {
  return request.put('/user/patient/update', data);
};

export const deletePatient = (id: number) => {
  return request.delete(`/user/patient/delete/${id}`);
};
