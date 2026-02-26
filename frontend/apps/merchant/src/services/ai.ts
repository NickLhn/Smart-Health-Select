import request from './request';

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

export const sendChatMessage = async (message: string): Promise<AIChatResponse> => {
    const res = await request.post<AIChatResponse>('/merchant/ai/chat', { message }, { timeout: 60000 });
    return res.data;
};

export const getChatHistory = async (): Promise<ChatHistoryMessage[]> => {
    const res = await request.get<ChatHistoryMessage[]>('/merchant/ai/history', { timeout: 20000 });
    return res.data;
};

export const clearChatHistory = async (): Promise<boolean> => {
    const res = await request.delete<boolean>('/merchant/ai/history', { timeout: 20000 });
    return res.data;
};

// SSE 不需要普通的 request 方法，而是直接通过 EventSource 连接
// 但如果需要发送初始消息来建立连接（有些实现是 POST 后返回 stream），可以使用 fetch
// 这里我们复用后端的 SSE 接口: /merchant/ai/stream
// 后端接口是 POST 请求，接收 JSON body，返回 text/event-stream
// 由于 EventSource 原生不支持 POST，我们需要使用 fetch-event-source 库或者自行实现 fetch 读取流
// 为了简化，我们先使用 fetch 读取 ReadableStream

export const streamChat = async (
    params: ChatRequest,
    onMessage: (content: string) => void,
    onError: (error: any) => void,
    onComplete: () => void
) => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/merchant/ai/stream', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(params)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
            throw new Error('Response body is null');
        }

        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data:')) {
                    const data = line.slice(5).trim();
                    if (data) {
                        onMessage(data);
                    }
                }
            }
        }
        onComplete();
    } catch (error) {
        onError(error);
    }
};
