package com.zhijian.ai.service;

import com.zhijian.ai.dto.AIChatRequest;
import com.zhijian.ai.dto.AIChatResponse;
import com.zhijian.ai.dto.ChatHistoryMessage;
import com.zhijian.common.result.Result;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;

/**
 * 用户端 AI 对话服务接口。
 */
public interface AiService {

    /**
     * 发送同步对话请求。
     *
     * @param request 对话请求参数
     * @param authorization 认证信息
     * @param requestId 请求 ID
     * @return AI 对话结果
     */
    Result<AIChatResponse> chat(AIChatRequest request, String authorization, String requestId);

    /**
     * 发起流式对话请求。
     *
     * @param request 对话请求参数
     * @param authorization 认证信息
     * @param requestId 请求 ID
     * @return SSE 推送对象
     */
    SseEmitter stream(AIChatRequest request, String authorization, String requestId);

    /**
     * 查询当前用户的对话历史。
     *
     * @return 对话历史列表
     */
    Result<List<ChatHistoryMessage>> history();

    /**
     * 清空当前用户的对话历史。
     *
     * @return 清空结果
     */
    Result<Boolean> clearHistory();
}
