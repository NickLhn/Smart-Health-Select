import request from './request';

export interface ImMessage {
  id: number;
  fromUserId: number;
  toUserId: number;
  content: string;
  type: number;
  readStatus: number;
  createTime: string;
}

export const sendMessage = (toUserId: number, content: string, type: number = 0) => {
  return request.post<ImMessage>('/im/send', { toUserId, content, type });
};

export const getHistory = (targetUserId: number) => {
  return request.get<ImMessage[]>('/im/history', { params: { targetUserId } });
};

export const getContacts = () => {
  return request.get<any[]>('/im/contacts');
};
