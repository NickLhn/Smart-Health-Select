package com.zhijian.ai.controller;

import com.zhijian.ai.dto.AIChatRequest;
import com.zhijian.ai.dto.AIChatResponse;
import com.zhijian.ai.dto.ChatHistoryMessage;
import com.zhijian.ai.service.AiService;
import com.zhijian.common.result.Result;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;

@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    @PostMapping("/chat")
    public Result<AIChatResponse> chat(
            @RequestBody AIChatRequest request,
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestHeader(value = "X-Request-ID", required = false) String requestId
    ) {
        return aiService.chat(request, authorization, requestId);
    }

    @PostMapping(value = "/stream", produces = org.springframework.http.MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(
            @RequestBody AIChatRequest request,
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestHeader(value = "X-Request-ID", required = false) String requestId
    ) {
        return aiService.stream(request, authorization, requestId);
    }

    @GetMapping("/history")
    public Result<List<ChatHistoryMessage>> history() {
        return aiService.history();
    }

    @DeleteMapping("/history")
    public Result<Boolean> clearHistory() {
        return aiService.clearHistory();
    }
}
