package com.zhijian.ai.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zhijian.ai.client.langgraph.LangGraphAgentClient;
import com.zhijian.ai.dto.AIChatRequest;
import com.zhijian.ai.dto.AIChatResponse;
import com.zhijian.ai.dto.ChatHistoryMessage;
import com.zhijian.ai.mapper.AiChatMemoryMapper;
import com.zhijian.ai.service.AiService;
import com.zhijian.common.context.UserContext;
import com.zhijian.common.result.Result;
import com.zhijian.common.result.ResultCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.net.ConnectException;
import java.net.SocketTimeoutException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

/**
 * 用户端 AI 对话服务实现类。
 */
@Service
@RequiredArgsConstructor
public class AiServiceImpl implements AiService {

    /**
     * 对话历史存储接口。
     */
    private final AiChatMemoryMapper memoryRepository;

    /**
     * LangGraph 智能体客户端。
     */
    private final LangGraphAgentClient agentClient;

    /**
     * JSON 序列化工具。
     */
    private final ObjectMapper objectMapper;

    /**
     * 发送用户端同步对话请求。
     * <p>
     * 该方法会校验登录状态和消息内容，并将下游异常统一转换为平台定义的错误码。
     *
     * @param request 对话请求参数
     * @param authorization 认证信息
     * @param requestId 请求 ID
     * @return AI 对话结果
     */
    @Override
    public Result<AIChatResponse> chat(AIChatRequest request, String authorization, String requestId) {
        String rid = normalizeRequestId(requestId);
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed(ResultCode.UNAUTHORIZED);
        }

        // 先挡掉空消息，避免无意义地打到下游 Agent 服务。
        String message = request == null ? null : request.getMessage();
        if (message == null || message.trim().isEmpty()) {
            return Result.failed("消息不能为空");
        }

        try {
            // 用户端会话 ID 由后端统一生成，避免前端随意串改上下文。
            LangGraphAgentClient.AgentChatData agentData = agentClient.chat(
                    buildConversationId(userId),
                    message.trim(),
                    authorization,
                    rid
            );
            AIChatResponse resp = new AIChatResponse();
            resp.setText(agentData == null || agentData.getReply() == null ? "" : agentData.getReply());
            resp.setRecommendations(extractCards(agentData));
            resp.setAction(extractAction(agentData));
            return Result.success(resp);
        } catch (Exception e) {
            AiError err = classifyError(e, rid);
            return Result.failed(err.resultCode);
        }
    }

    /**
     * 发起用户端流式对话请求。
     * <p>
     * 流式结果通过异步任务推送到 SSE 通道，避免阻塞当前请求线程。
     *
     * @param request 对话请求参数
     * @param authorization 认证信息
     * @param requestId 请求 ID
     * @return SSE 推送对象
     */
    @Override
    public SseEmitter stream(AIChatRequest request, String authorization, String requestId) {
        SseEmitter emitter = new SseEmitter(0L);
        String rid = normalizeRequestId(requestId);

        Long userId = UserContext.getUserId();
        String message = request == null ? null : request.getMessage();

        if (userId == null) {
            CompletableFuture.runAsync(
                    () -> completeWithError(emitter, new AiError("AUTH", ResultCode.UNAUTHORIZED, rid), "请先登录")
            );
            return emitter;
        }

        if (message == null || message.trim().isEmpty()) {
            CompletableFuture.runAsync(() -> completeWithMessage(emitter, "消息不能为空"));
            return emitter;
        }

        String conversationId = buildConversationId(userId);
        // 流式响应改成异步推送，避免请求线程长时间阻塞。
        CompletableFuture.runAsync(() -> {
            try {
                LangGraphAgentClient.AgentChatData agentData = agentClient.chat(conversationId, message.trim(), authorization, rid);
                String reply = agentData == null || agentData.getReply() == null ? "" : agentData.getReply();
                sendMessage(emitter, reply);
                sendCards(emitter, extractCards(agentData));
                sendAction(emitter, extractAction(agentData));
                sendDone(emitter);
                emitter.complete();
            } catch (Exception e) {
                AiError err = classifyError(e, rid);
                // 下游错误统一翻译成前端可直接展示的提示语。
                String msg = switch (err.type) {
                    case "AUTH" -> "登录已过期，请重新登录后再试。";
                    case "TIMEOUT" -> "AI响应超时，请稍后再试。";
                    case "UNAVAILABLE" -> "AI服务未启动或不可用，请稍后再试。";
                    default -> "AI服务暂时繁忙，请稍后再试。";
                };
                completeWithError(emitter, err, msg);
            }
        });

        return emitter;
    }

    /**
     * 查询当前用户的对话历史。
     * <p>
     * 历史消息从存储层读取后，会转换成前端统一使用的消息结构。
     *
     * @return 对话历史列表
     */
    @Override
    public Result<List<ChatHistoryMessage>> history() {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }

        String conversationId = buildConversationId(userId);
        List<String> rawItems = memoryRepository.loadHistory(conversationId, 200);
        if (rawItems == null || rawItems.isEmpty()) {
            return Result.success(List.of());
        }

        // 历史消息原始结构来自存储层，这里转换成前端统一展示模型。
        long now = System.currentTimeMillis();
        long baseTs = now - (long) rawItems.size() * 10L;
        List<ChatHistoryMessage> result = new ArrayList<>(rawItems.size());

        for (int i = 0; i < rawItems.size(); i++) {
            String raw = rawItems.get(i);
            Map<String, Object> item;
            try {
                item = objectMapper.readValue(raw, new TypeReference<Map<String, Object>>() {});
            } catch (Exception ignored) {
                continue;
            }

            String role = Objects.toString(item.get("role"), "");
            String content = Objects.toString(item.get("content"), "");
            String sender = "assistant".equals(role) ? "ai" : "user";

            ChatHistoryMessage msg = new ChatHistoryMessage();
            msg.setId(sender + "_" + i);
            msg.setSender(sender);
            msg.setText(content);
            msg.setTimestamp(baseTs + i * 10L);
            Object cards = item.get("cards");
            if (cards != null) {
                msg.setRecommendations(cards);
            }
            result.add(msg);
        }

        return Result.success(result);
    }

    /**
     * 清空当前用户的对话历史。
     *
     * @return 清空结果
     */
    @Override
    public Result<Boolean> clearHistory() {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }

        // 清历史时同时清掉对话消息和状态缓存。
        String conversationId = buildConversationId(userId);
        boolean ok = memoryRepository.clearConversation(conversationId);
        return Result.success(ok);
    }

    /**
     * 构建会话 ID。
     * <p>
     * 管理端和普通用户使用不同前缀，避免历史消息串话。
     *
     * @param userId 用户 ID
     * @return 会话 ID
     */
    private String buildConversationId(Long userId) {
        // 管理员与普通用户使用不同前缀，避免共用一个上下文空间。
        if (UserContext.isAdmin()) {
            return "admin:" + userId;
        }
        return "customer:" + userId;
    }

    /**
     * 发送普通文本消息并完成 SSE 通道。
     *
     * @param emitter SSE 推送对象
     * @param message 消息内容
     */
    private void completeWithMessage(SseEmitter emitter, String message) {
        try {
            sendMessage(emitter, message);
        } finally {
            emitter.complete();
        }
    }

    /**
     * 发送错误事件和提示消息并完成 SSE 通道。
     *
     * @param emitter SSE 推送对象
     * @param error 错误信息
     * @param message 提示消息
     */
    private void completeWithError(SseEmitter emitter, AiError error, String message) {
        try {
            sendError(emitter, error);
            sendMessage(emitter, message);
        } finally {
            emitter.complete();
        }
    }

    /**
     * 发送文本消息事件。
     *
     * @param emitter SSE 推送对象
     * @param message 消息内容
     */
    private void sendMessage(SseEmitter emitter, String message) {
        try {
            emitter.send(SseEmitter.event().data(message == null ? "" : message));
        } catch (IOException ignored) {
        }
    }

    /**
     * 发送错误事件。
     *
     * @param emitter SSE 推送对象
     * @param error 错误信息
     */
    private void sendError(SseEmitter emitter, AiError error) {
        try {
            String payload = objectMapper.writeValueAsString(
                    Map.of(
                            "type", error.type,
                            "code", error.resultCode.getCode(),
                            "message", error.resultCode.getMessage(),
                            "requestId", error.requestId
                    )
            );
            emitter.send(SseEmitter.event().name("error").data(payload));
        } catch (Exception ignored) {
        }
    }

    /**
     * 发送完成事件。
     *
     * @param emitter SSE 推送对象
     */
    private void sendDone(SseEmitter emitter) {
        try {
            emitter.send(SseEmitter.event().name("done").data("[DONE]"));
        } catch (IOException ignored) {
        }
    }

    /**
     * 提取推荐卡片数据。
     *
     * @param agentData 智能体响应数据
     * @return 推荐卡片数据
     */
    private Object extractCards(LangGraphAgentClient.AgentChatData agentData) {
        if (agentData == null || agentData.getState() == null) {
            return null;
        }
        return agentData.getState().get("cards");
    }

    /**
     * 提取前端动作指令。
     *
     * @param agentData 智能体响应数据
     * @return 前端动作指令
     */
    private Object extractAction(LangGraphAgentClient.AgentChatData agentData) {
        if (agentData == null || agentData.getState() == null) {
            return null;
        }
        return agentData.getState().get("action");
    }

    /**
     * 发送推荐卡片事件。
     *
     * @param emitter SSE 推送对象
     * @param cards 推荐卡片数据
     */
    private void sendCards(SseEmitter emitter, Object cards) {
        // 空卡片不下发，减少前端处理无效事件的分支。
        if (cards == null) {
            return;
        }
        if (cards instanceof java.util.List<?> list && list.isEmpty()) {
            return;
        }
        if (cards instanceof java.util.Map<?, ?> map && map.isEmpty()) {
            return;
        }
        try {
            String payload = cards instanceof String s ? s : objectMapper.writeValueAsString(cards);
            emitter.send(SseEmitter.event().name("cards").data(payload));
        } catch (Exception ignored) {
        }
    }

    /**
     * 发送动作指令事件。
     *
     * @param emitter SSE 推送对象
     * @param action 前端动作指令
     */
    private void sendAction(SseEmitter emitter, Object action) {
        // action 事件单独发送，方便前端按类型做跳转或辅助动作。
        if (action == null) {
            return;
        }
        try {
            String payload;
            if (action instanceof String s) {
                payload = s;
            } else if (action instanceof Map<?, ?> map) {
                payload = buildActionJson(map);
            } else {
                payload = objectMapper.writeValueAsString(action);
            }
            emitter.send(SseEmitter.event().name("action").data(payload));
        } catch (Exception ignored) {
        }
    }

    /**
     * 构建动作指令 JSON 字符串。
     *
     * @param map 动作指令数据
     * @return 动作指令 JSON
     */
    private String buildActionJson(Map<?, ?> map) {
        String type = Objects.toString(map.get("type"), "");
        String url = Objects.toString(map.get("url"), "");
        Object replaceRaw = map.get("replace");
        boolean replace = false;
        if (replaceRaw instanceof Boolean b) {
            replace = b;
        } else if (replaceRaw instanceof Number n) {
            replace = n.intValue() != 0;
        } else if (replaceRaw != null) {
            replace = "true".equalsIgnoreCase(replaceRaw.toString());
        }
        return "{\"type\":\"" + escapeJson(type) + "\",\"url\":\"" + escapeJson(url) + "\",\"replace\":" + replace + "}";
    }

    /**
     * 转义 JSON 字符串内容。
     *
     * @param s 原始字符串
     * @return 转义后的字符串
     */
    private String escapeJson(String s) {
        if (s == null || s.isEmpty()) {
            return "";
        }
        StringBuilder sb = new StringBuilder(s.length() + 16);
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            switch (c) {
                case '\\' -> sb.append("\\\\");
                case '"' -> sb.append("\\\"");
                case '\b' -> sb.append("\\b");
                case '\f' -> sb.append("\\f");
                case '\n' -> sb.append("\\n");
                case '\r' -> sb.append("\\r");
                case '\t' -> sb.append("\\t");
                default -> {
                    if (c < 0x20) {
                        sb.append(String.format("\\u%04x", (int) c));
                    } else {
                        sb.append(c);
                    }
                }
            }
        }
        return sb.toString();
    }

    /**
     * 规范化请求 ID。
     *
     * @param raw 原始请求 ID
     * @return 规范化后的请求 ID
     */
    private String normalizeRequestId(String raw) {
        // requestId 优先复用前端值，缺失时后端兜底生成。
        String val = raw == null ? "" : raw.trim();
        if (!val.isEmpty()) {
            return val;
        }
        return UUID.randomUUID().toString();
    }

    /**
     * 对下游异常进行分类映射。
     *
     * @param e 原始异常
     * @param requestId 请求 ID
     * @return 分类后的错误信息
     */
    private AiError classifyError(Exception e, String requestId) {
        // 统一把下游异常映射成平台级错误类型，控制前端处理面。
        Throwable cause = unwrapCause(e);
        if (cause instanceof LangGraphAgentClient.AgentHttpException agentHttp) {
            int status = agentHttp.getStatus();
            if (status == 401) {
                return new AiError("AUTH", ResultCode.UNAUTHORIZED, requestId);
            }
            if (status >= 500) {
                return new AiError("BAD_GATEWAY", ResultCode.AI_BAD_GATEWAY, requestId);
            }
            if (status == 404) {
                return new AiError("BAD_GATEWAY", ResultCode.AI_BAD_GATEWAY, requestId);
            }
            return new AiError("BAD_GATEWAY", ResultCode.AI_BAD_GATEWAY, requestId);
        }
        if (cause instanceof SocketTimeoutException) {
            return new AiError("TIMEOUT", ResultCode.AI_TIMEOUT, requestId);
        }
        if (cause instanceof ConnectException) {
            return new AiError("UNAVAILABLE", ResultCode.AI_UNAVAILABLE, requestId);
        }
        if (cause instanceof IOException io && "Missing Authorization".equalsIgnoreCase(io.getMessage())) {
            return new AiError("AUTH", ResultCode.UNAUTHORIZED, requestId);
        }
        return new AiError("BAD_GATEWAY", ResultCode.AI_BAD_GATEWAY, requestId);
    }

    /**
     * 展开异常链并返回底层异常。
     *
     * @param e 原始异常
     * @return 底层异常
     */
    private Throwable unwrapCause(Throwable e) {
        // 尽量向下找到真正的底层异常，避免被包装异常干扰判断。
        Throwable cur = e;
        for (int i = 0; i < 8; i++) {
            Throwable next = cur.getCause();
            if (next == null || next == cur) {
                break;
            }
            cur = next;
        }
        return cur;
    }

    /**
     * AI 调用错误信息。
     */
    private static class AiError {

        /**
         * 错误类型。
         */
        private final String type;

        /**
         * 平台错误码。
         */
        private final ResultCode resultCode;

        /**
         * 请求 ID。
         */
        private final String requestId;

        /**
         * 构造 AI 调用错误信息。
         *
         * @param type 错误类型
         * @param resultCode 平台错误码
         * @param requestId 请求 ID
         */
        private AiError(String type, ResultCode resultCode, String requestId) {
            this.type = type;
            this.resultCode = resultCode;
            this.requestId = requestId;
        }
    }
}
