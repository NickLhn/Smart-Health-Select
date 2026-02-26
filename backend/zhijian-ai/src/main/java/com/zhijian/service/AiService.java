package com.zhijian.service;

import com.zhijian.common.result.Result;
import com.zhijian.dto.ai.AIChatRequest;
import com.zhijian.dto.ai.AIChatResponse;
import com.zhijian.dto.ai.ChatHistoryMessage;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;

public interface AiService {
    Result<AIChatResponse> chat(AIChatRequest request, String authorization, String requestId);

    SseEmitter stream(AIChatRequest request, String authorization, String requestId);

    Result<List<ChatHistoryMessage>> history();

    Result<Boolean> clearHistory();
}

