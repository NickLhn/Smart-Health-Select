package com.zhijian.controller;

import com.zhijian.common.context.UserContext;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zhijian.common.util.RedisUtil;
import com.zhijian.dto.ai.ChatRequestDTO;
import com.zhijian.pojo.user.entity.Merchant;
import com.zhijian.service.AiService;
import com.zhijian.service.MerchantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

/**
 * 商家端 AI 助手控制器
 * <p>提供“经营参谋”服务，注入店铺经营数据上下文</p>
 */
@Tag(name = "商家端 AI 助手")
@RestController
@RequestMapping("/merchant/ai")
@RequiredArgsConstructor
@Slf4j
public class MerchantAiController {

    private final AiService aiService;
    private final MerchantService merchantService;
    private final RedisUtil redisUtil;
    private final ObjectMapper objectMapper;
    private final ExecutorService executorService = Executors.newCachedThreadPool();
    private static final long CHAT_HISTORY_TTL_HOURS = 24L;

    @Operation(summary = "商家智能助手 (流式)")
    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamChat(@RequestBody ChatRequestDTO request) {
        Long currentUserId = UserContext.getUserId();
        String userMessage = request.getMessage();

        // 1. 基础校验
        if (currentUserId == null) {
            return createErrorEmitter("请先登录商家账号");
        }

        SseEmitter emitter = new SseEmitter(180000L);

        executorService.submit(() -> {
            StringBuilder fullAnswer = new StringBuilder();
            String cozeUserId = null;
            try {
                Merchant merchant = merchantService.getByUserId(currentUserId);
                if (merchant == null) {
                    sendError(emitter, "未找到关联的店铺信息");
                    return;
                }

                String systemPrompt = buildBusinessContext(merchant);
                cozeUserId = "merchant_" + merchant.getId();

                appendMerchantChatHistory(cozeUserId, buildMerchantUserHistoryMessage(userMessage));

                aiService.streamChatMerchant(systemPrompt, userMessage, cozeUserId, content -> {
                    try {
                        fullAnswer.append(content);
                        emitter.send(SseEmitter.event().name("message").data(content));
                    } catch (IOException e) {
                        log.debug("SSE send error: {}", e.getMessage());
                    }
                });

                emitter.send(SseEmitter.event().name("done").data("[DONE]"));
                emitter.complete();

            } catch (Exception e) {
                log.error("Merchant AI Stream error", e);
                sendError(emitter, "AI 服务暂时繁忙，请稍后再试");
            } finally {
                if (cozeUserId != null) {
                    String aiText = fullAnswer.toString();
                    if (!aiText.isBlank()) {
                        appendMerchantChatHistory(cozeUserId, buildMerchantAiHistoryMessage(aiText));
                    }
                }
            }
        });

        return emitter;
    }

    private String buildBusinessContext(Merchant merchant) {
        StringBuilder sb = new StringBuilder();
        sb.append("你是一个商家端 AI 智能助手，服务于店铺“").append(merchant.getShopName()).append("”。");
        sb.append("请根据商家的提问，结合通用电商与药店运营知识给出清晰、务实的建议，不要虚构具体业务数据。");
        return sb.toString();
    }

    private SseEmitter createErrorEmitter(String msg) {
        SseEmitter emitter = new SseEmitter(0L);
        try {
            emitter.send(SseEmitter.event().name("error").data(msg));
            emitter.complete();
        } catch (IOException e) {
            // ignore
        }
        return emitter;
    }

    private void sendError(SseEmitter emitter, String msg) {
        try {
            emitter.send(SseEmitter.event().name("message").data(msg));
            emitter.send(SseEmitter.event().name("done").data("[DONE]"));
            emitter.complete();
        } catch (IOException e) {
            log.debug("Error sending error message", e);
        }
    }

    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    private static class MerchantChatHistoryMessage {
        private String id;
        private String text;
        private String sender;
        private long timestamp;
    }

    private String merchantChatHistoryKey(String userKey) {
        return "ai:merchant:chat:history:" + userKey;
    }

    private MerchantChatHistoryMessage buildMerchantUserHistoryMessage(String userMessage) {
        return new MerchantChatHistoryMessage(UUID.randomUUID().toString(), userMessage, "user", System.currentTimeMillis());
    }

    private MerchantChatHistoryMessage buildMerchantAiHistoryMessage(String aiText) {
        return new MerchantChatHistoryMessage(UUID.randomUUID().toString(), aiText, "ai", System.currentTimeMillis());
    }

    private List<MerchantChatHistoryMessage> getMerchantChatHistory(String userKey) {
        String key = merchantChatHistoryKey(userKey);
        String raw = redisUtil.get(key);
        if (raw == null || raw.isBlank()) return Collections.emptyList();
        try {
            return objectMapper.readValue(raw, new TypeReference<List<MerchantChatHistoryMessage>>() {});
        } catch (Exception e) {
            log.warn("Failed to parse merchant chat history for key {}", key, e);
            return Collections.emptyList();
        }
    }

    private void appendMerchantChatHistory(String userKey, MerchantChatHistoryMessage... newMessages) {
        String key = merchantChatHistoryKey(userKey);
        List<MerchantChatHistoryMessage> existing = new ArrayList<>(getMerchantChatHistory(userKey));
        Collections.addAll(existing, newMessages);
        try {
            String json = objectMapper.writeValueAsString(existing);
            redisUtil.set(key, json, CHAT_HISTORY_TTL_HOURS, TimeUnit.HOURS);
        } catch (Exception e) {
            log.warn("Failed to write merchant chat history for key {}", key, e);
        }
    }
}
