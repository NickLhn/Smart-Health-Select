package com.zhijian.ai.service;

import com.zhijian.ai.dto.AIChatRequest;
import com.zhijian.ai.dto.AIChatResponse;
import com.zhijian.ai.dto.ChatHistoryMessage;
import com.zhijian.common.result.Result;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;

public interface AiService {
    Result<AIChatResponse> chat(AIChatRequest request, String authorization, String requestId);

    SseEmitter stream(AIChatRequest request, String authorization, String requestId);

    Result<List<ChatHistoryMessage>> history();

    Result<Boolean> clearHistory();
}
