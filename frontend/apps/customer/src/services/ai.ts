import request from './request';
import type { Medicine } from './medicine';

export interface AIChatResponse {
  text: string;
  recommendations?: Medicine[];
}

export interface ChatHistoryMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: number;
  recommendations?: Medicine[];
}

export const sendChatMessage = async (message: string): Promise<AIChatResponse> => {
  const res = await request.post<AIChatResponse>('/ai/chat', { message }, { timeout: 60000 });
  return res.data;
};

export const getChatHistory = async (): Promise<ChatHistoryMessage[]> => {
  const res = await request.get<ChatHistoryMessage[]>('/ai/history', { timeout: 20000 });
  return res.data;
};

export const clearChatHistory = async (): Promise<boolean> => {
  const res = await request.delete<boolean>('/ai/history', { timeout: 20000 });
  return res.data;
};

export interface StreamCallbacks {
  onMessage: (content: string) => void;
  onCards: (cards: Medicine[]) => void;
  onDone: () => void;
  onError: (error: any) => void;
}

export const streamChatMessage = async (message: string, callbacks: StreamCallbacks) => {
  const token = localStorage.getItem('token');
  try {
    const response = await fetch('/api/ai/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('Response body is null');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      
      // SSE events are separated by double newlines
      const parts = buffer.split('\n\n');
      buffer = parts.pop() || ''; // Keep the last incomplete part

      for (const part of parts) {
        processPart(part, callbacks);
      }
    }

    // Process any remaining buffer when stream ends
    if (buffer.trim()) {
      processPart(buffer, callbacks);
    }
  } catch (error) {
    callbacks.onError(error);
  }
};

const processPart = (part: string, callbacks: StreamCallbacks) => {
    const lines = part.split('\n');
    let eventType = 'message';
    let data = '';
  
    for (const line of lines) {
      if (line.startsWith('event:')) {
        eventType = line.substring(6).trim();
      } else if (line.startsWith('data:')) {
        const lineData = line.substring(5).trim();
        data = data ? data + '\n' + lineData : lineData;
      }
    }
  
    if (data) {
    if (data === '[DONE]') {
      callbacks.onDone();
      return;
    }

    if (eventType === 'cards') {
      try {
        const cards = JSON.parse(data);
        callbacks.onCards(cards);
      } catch (e) {
        console.error('Failed to parse cards JSON', e);
      }
    } else if (eventType === 'message') {
      callbacks.onMessage(data);
    }
  }
};
