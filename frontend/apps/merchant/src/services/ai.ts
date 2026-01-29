import request from './request';

export interface ChatRequest {
    message: string;
}

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
