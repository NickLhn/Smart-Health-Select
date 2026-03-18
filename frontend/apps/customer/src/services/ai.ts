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
  onAction?: (action: any) => void;
  onDone: () => void;
  onError: (error: any) => void;
}

const buildRequestId = () => {
  if (typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function') {
    return (crypto as any).randomUUID();
  }
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

export const streamChatMessage = async (message: string, callbacks: StreamCallbacks) => {
  const token = localStorage.getItem('token');
  const requestId = buildRequestId();
  try {
    const response = await fetch('/api/ai/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
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
    let streamEnded = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      buffer = buffer.replace(/\r\n/g, '\n');
      
      // SSE events are separated by double newlines
      const parts = buffer.split('\n\n');
      buffer = parts.pop() || ''; // Keep the last incomplete part

      for (const part of parts) {
        if (streamEnded) break;
        streamEnded = processPart(part, callbacks) || streamEnded;
      }
    }

    // Process any remaining buffer when stream ends
    if (!streamEnded && buffer.trim()) {
      buffer = buffer.replace(/\r\n/g, '\n');
      processPart(buffer, callbacks);
    }

    if (!streamEnded) {
      callbacks.onDone();
    }
  } catch (error) {
    callbacks.onError({ type: 'NETWORK', requestId, error });
  }
};

const processPart = (part: string, callbacks: StreamCallbacks) => {
    const lines = part.split('\n');
    let eventType = 'message';
    let data = '';
  
    for (const line of lines) {
      const normalizedLine = line.endsWith('\r') ? line.slice(0, -1) : line;
      if (normalizedLine.startsWith('event:')) {
        eventType = normalizedLine.substring(6).trim();
      } else if (normalizedLine.startsWith('data:')) {
        const lineData = normalizedLine.substring(5).trim();
        data = data ? data + '\n' + lineData : lineData;
      }
    }
  
    if (data) {
    if (eventType === 'done' || data === '[DONE]') {
      callbacks.onDone();
      return true;
    }

    if (eventType === 'error') {
      try {
        callbacks.onError(JSON.parse(data));
      } catch (e) {
        callbacks.onError({ type: 'UNKNOWN', message: data });
      }
      callbacks.onDone();
      return true;
    }

    if (eventType === 'cards') {
      try {
        const cards = JSON.parse(data);
        callbacks.onCards(cards);
      } catch (e) {
        console.error('Failed to parse cards JSON', e);
      }
    } else if (eventType === 'action') {
      if (typeof callbacks.onAction === 'function') {
        try {
          callbacks.onAction(JSON.parse(data));
        } catch (e) {
          callbacks.onAction(data);
        }
      }
    } else if (eventType === 'message') {
      callbacks.onMessage(data);
    }
  }
  return false;
};
