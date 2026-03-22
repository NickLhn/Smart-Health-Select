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

@Service
@RequiredArgsConstructor
public class AiServiceImpl implements AiService {

    private final AiChatMemoryMapper memoryRepository;
    private final LangGraphAgentClient agentClient;
    private final ObjectMapper objectMapper;

    @Override
    public Result<AIChatResponse> chat(AIChatRequest request, String authorization, String requestId) {
        // 同步对话接口，直接等待 LangGraph 返回完整回答。
        String rid = normalizeRequestId(requestId);
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed(ResultCode.UNAUTHORIZED);
        }
        String message = request == null ? null : request.getMessage();
        if (message == null || message.trim().isEmpty()) {
            return Result.failed("消息不能为空");
        }

        try {
            // conversationId 由后端根据用户身份统一生成。
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
            // 下游异常统一转换为平台定义的错误码。
            AiError err = classifyError(e, rid);
            return Result.failed(err.resultCode);
        }
    }

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
        // 流式接口通过异步任务执行，避免阻塞请求线程。
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
                // 根据异常类型返回更贴近用户理解的提示。
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

    @Override
    public Result<List<ChatHistoryMessage>> history() {
        // 历史消息从 memoryRepository 读取，再转成前端统一展示结构。
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }

        String conversationId = buildConversationId(userId);
        List<String> rawItems = memoryRepository.loadHistory(conversationId, 200);
        if (rawItems == null || rawItems.isEmpty()) {
            return Result.success(List.of());
        }

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

    @Override
    public Result<Boolean> clearHistory() {
        // 清空当前用户的 AI 历史对话。
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }

        String conversationId = buildConversationId(userId);
        boolean ok = memoryRepository.clearConversation(conversationId);
        return Result.success(ok);
    }

    private String buildConversationId(Long userId) {
        // 管理端和普通用户使用不同前缀，避免历史消息串话。
        if (UserContext.isAdmin()) {
            return "admin:" + userId;
        }
        return "customer:" + userId;
    }

    private void completeWithMessage(SseEmitter emitter, String message) {
        try {
            sendMessage(emitter, message);
        } finally {
            emitter.complete();
        }
    }

    private void completeWithError(SseEmitter emitter, AiError error, String message) {
        try {
            sendError(emitter, error);
            sendMessage(emitter, message);
        } finally {
            emitter.complete();
        }
    }

    private void sendMessage(SseEmitter emitter, String message) {
        try {
            emitter.send(SseEmitter.event().data(message == null ? "" : message));
        } catch (IOException ignored) {
        }
    }

    private void sendError(SseEmitter emitter, AiError error) {
        // 错误信息通过 SSE 的 error 事件单独发送。
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

    private void sendDone(SseEmitter emitter) {
        try {
            emitter.send(SseEmitter.event().name("done").data("[DONE]"));
        } catch (IOException ignored) {
        }
    }

    private Object extractCards(LangGraphAgentClient.AgentChatData agentData) {
        if (agentData == null || agentData.getState() == null) {
            return null;
        }
        return agentData.getState().get("cards");
    }

    private Object extractAction(LangGraphAgentClient.AgentChatData agentData) {
        if (agentData == null || agentData.getState() == null) {
            return null;
        }
        return agentData.getState().get("action");
    }

    private void sendCards(SseEmitter emitter, Object cards) {
        // 推荐卡片为空时不下发事件，减少前端空处理逻辑。
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

    private void sendAction(SseEmitter emitter, Object action) {
        // action 事件用于指导前端执行跳转等额外动作。
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

    private String normalizeRequestId(String raw) {
        // requestId 优先复用前端传入值，缺失时后端自动生成。
        String val = raw == null ? "" : raw.trim();
        if (!val.isEmpty()) {
            return val;
        }
        return UUID.randomUUID().toString();
    }

    private AiError classifyError(Exception e, String requestId) {
        // 把连接异常、超时异常、鉴权异常统一映射到可识别的错误类型。
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

    private Throwable unwrapCause(Throwable e) {
        // 向下展开异常链，尽量定位真正的底层异常。
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

    private static class AiError {
        private final String type;
        private final ResultCode resultCode;
        private final String requestId;

        private AiError(String type, ResultCode resultCode, String requestId) {
            this.type = type;
            this.resultCode = resultCode;
            this.requestId = requestId;
        }
    }
}
