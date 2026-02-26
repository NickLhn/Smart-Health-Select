package com.zhijian.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zhijian.client.langgraph.LangGraphAgentClient;
import com.zhijian.common.context.UserContext;
import com.zhijian.common.result.Result;
import com.zhijian.common.result.ResultCode;
import com.zhijian.dto.ai.AIChatRequest;
import com.zhijian.dto.ai.AIChatResponse;
import com.zhijian.dto.ai.ChatHistoryMessage;
import com.zhijian.mapper.AiChatMemoryMapper;
import com.zhijian.service.AiService;
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
        CompletableFuture.runAsync(() -> {
            try {
                LangGraphAgentClient.AgentChatData agentData = agentClient.chat(conversationId, message.trim(), authorization, rid);
                String reply = agentData == null || agentData.getReply() == null ? "" : agentData.getReply();
                sendMessage(emitter, reply);
                emitter.complete();
            } catch (Exception e) {
                AiError err = classifyError(e, rid);
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
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }

        String conversationId = buildConversationId(userId);
        boolean ok = memoryRepository.clearConversation(conversationId);
        return Result.success(ok);
    }

    private String buildConversationId(Long userId) {
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
        String val = raw == null ? "" : raw.trim();
        if (!val.isEmpty()) {
            return val;
        }
        return UUID.randomUUID().toString();
    }

    private AiError classifyError(Exception e, String requestId) {
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
