package com.zhijian.ai.controller;

import com.zhijian.ai.dto.AIChatRequest;
import com.zhijian.ai.dto.AIChatResponse;
import com.zhijian.ai.dto.ChatHistoryMessage;
import com.zhijian.ai.service.MerchantAiService;
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

/**
 * 商家端 AI 对话控制器。
 */
@RestController
@RequestMapping("/merchant/ai")
@RequiredArgsConstructor
public class MerchantAiController {

    /**
     * 商家端 AI 对话服务。
     */
    private final MerchantAiService merchantAiService;

    /**
     * 发起商家端同步对话请求。
     *
     * @param request 对话请求参数
     * @param authorization 认证信息
     * @param requestId 请求 ID
     * @return AI 对话结果
     */
    @PostMapping("/chat")
    public Result<AIChatResponse> chat(
            @RequestBody AIChatRequest request,
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestHeader(value = "X-Request-ID", required = false) String requestId
    ) {
        return merchantAiService.chat(request, authorization, requestId);
    }

    /**
     * 发起商家端流式对话请求。
     *
     * @param request 对话请求参数
     * @param authorization 认证信息
     * @param requestId 请求 ID
     * @return SSE 推送对象
     */
    @PostMapping(value = "/stream", produces = org.springframework.http.MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(
            @RequestBody AIChatRequest request,
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestHeader(value = "X-Request-ID", required = false) String requestId
    ) {
        return merchantAiService.stream(request, authorization, requestId);
    }

    /**
     * 查询当前商家的对话历史。
     *
     * @return 对话历史列表
     */
    @GetMapping("/history")
    public Result<List<ChatHistoryMessage>> history() {
        return merchantAiService.history();
    }

    /**
     * 清空当前商家的对话历史。
     *
     * @return 清空结果
     */
    @DeleteMapping("/history")
    public Result<Boolean> clearHistory() {
        return merchantAiService.clearHistory();
    }
}
