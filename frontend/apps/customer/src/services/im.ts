import request from './request';

// 用户端站内消息接口。
export interface ImMessage {
  id: number;
  fromUserId: number;
  toUserId: number;
  content: string;
  type: number;
  readStatus: number;
  createTime: string;
}

// 向指定用户发送消息。
export const sendMessage = (toUserId: number, content: string, type: number = 0) => {
  return request.post<ImMessage>('/im/send', { toUserId, content, type });
};

// 拉取与某个联系人的聊天记录。
export const getHistory = (targetUserId: number) => {
  return request.get<ImMessage[]>('/im/history', { params: { targetUserId } });
};

// 获取当前用户的联系人列表。
export const getContacts = () => {
  return request.get<any[]>('/im/contacts');
};
