import request from './request';
import type { Medicine } from './medicine';

export interface AIChatResponse {
  text: string;
  recommendations?: Medicine[];
}

export const sendChatMessage = async (message: string): Promise<AIChatResponse> => {
  const res = await request.post<AIChatResponse>('/ai/chat', { message }, { timeout: 60000 });
  return res.data;
};
