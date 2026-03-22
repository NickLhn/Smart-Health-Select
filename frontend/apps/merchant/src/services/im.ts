import request from './request';

// 商家端消息接口。
export interface ImMessage {
  id: number;
  fromUserId: number;
  toUserId: number;
  content: string;
  type: number;
  readStatus: number;
  createTime: string;
}

// 发送消息。
export const sendMessage = (toUserId: number, content: string, type: number = 0) => {
  return request.post<ImMessage>('/im/send', { toUserId, content, type });
};

// 获取与指定联系人的历史消息。
export const getHistory = (targetUserId: number) => {
  return request.get<ImMessage[]>('/im/history', { params: { targetUserId } });
};

// 获取联系人列表。
export const getContacts = () => {
  return request.get<any[]>('/im/contacts');
};
