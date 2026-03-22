import request from './request';

// 管理端 AI 对话接口。
export interface AIChatResponse {
  text: string;
  recommendations?: any;
  action?: any;
}

export interface ChatHistoryMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: number;
  recommendations?: any;
}

// 普通对话接口。
export const sendChatMessage = async (message: string): Promise<AIChatResponse> => {
  const res = await request.post<AIChatResponse>('/ai/chat', { message }, { timeout: 60000 });
  return res.data;
};

// 获取历史对话。
export const getChatHistory = async (): Promise<ChatHistoryMessage[]> => {
  const res = await request.get<ChatHistoryMessage[]>('/ai/history', { timeout: 20000 });
  return res.data;
};

// 清空历史对话。
export const clearChatHistory = async (): Promise<boolean> => {
  const res = await request.delete<boolean>('/ai/history', { timeout: 20000 });
  return res.data;
};
