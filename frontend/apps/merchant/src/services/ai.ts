import request from './request';

// 商家端 AI 助手接口。
export interface ChatRequest {
    message: string;
}

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

export interface StreamCallbacks {
    onMessage: (content: string) => void;
    onCards?: (cards: any[]) => void;
    onAction?: (action: any) => void;
    onDone: () => void;
    onError: (error: any) => void;
}

// 普通对话接口，适合一次性等待完整回答。
export const sendChatMessage = async (message: string): Promise<AIChatResponse> => {
    const res = await request.post<AIChatResponse>('/merchant/ai/chat', { message }, { timeout: 60000 });
    return res.data;
};

// 获取商家 AI 对话历史。
export const getChatHistory = async (): Promise<ChatHistoryMessage[]> => {
    const res = await request.get<ChatHistoryMessage[]>('/merchant/ai/history', { timeout: 20000 });
    return res.data;
};

// 清空商家 AI 对话历史。
export const clearChatHistory = async (): Promise<boolean> => {
    const res = await request.delete<boolean>('/merchant/ai/history', { timeout: 20000 });
    return res.data;
};

const buildRequestId = () => {
    // 为每次流式会话生成唯一 requestId，便于后端日志跟踪。
    if (typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function') {
        return (crypto as any).randomUUID();
    }
    return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

// 流式对话接口，适合边生成边展示回答。
export const streamChat = async (
    params: ChatRequest,
    callbacks: StreamCallbacks
) => {
    const token = localStorage.getItem('token');
    const requestId = buildRequestId();
    try {
        const response = await fetch('/api/merchant/ai/stream', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Request-ID': requestId,
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify(params)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('Response body is null');
        }

        const decoder = new TextDecoder();
        let buffer = '';
        let streamEnded = false;

        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }

            buffer += decoder.decode(value, { stream: true });
            buffer = buffer.replace(/\r\n/g, '\n');

            // SSE 事件之间通过空行分隔。
            const parts = buffer.split('\n\n');
            buffer = parts.pop() || '';

            for (const part of parts) {
                if (streamEnded) break;
                streamEnded = processPart(part, callbacks) || streamEnded;
            }
        }

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
            data = data ? `${data}\n${lineData}` : lineData;
        }
    }

    if (!data) {
        return false;
    }

    if (eventType === 'done' || data === '[DONE]') {
        callbacks.onDone();
        return true;
    }

    if (eventType === 'error') {
        try {
            callbacks.onError(JSON.parse(data));
        } catch {
            callbacks.onError({ type: 'UNKNOWN', message: data });
        }
        callbacks.onDone();
        return true;
    }

    if (eventType === 'cards') {
        if (typeof callbacks.onCards === 'function') {
            try {
                callbacks.onCards(JSON.parse(data));
            } catch {
                callbacks.onCards([]);
            }
        }
        return false;
    }

    if (eventType === 'action') {
        if (typeof callbacks.onAction === 'function') {
            try {
                callbacks.onAction(JSON.parse(data));
            } catch {
                callbacks.onAction(data);
            }
        }
        return false;
    }

    callbacks.onMessage(data);
    return false;
};
