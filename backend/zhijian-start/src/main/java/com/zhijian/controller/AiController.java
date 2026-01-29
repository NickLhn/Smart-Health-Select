package com.zhijian.controller;

import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.zhijian.dto.ai.ChatRequestDTO;
import com.zhijian.service.AiService;
import com.zhijian.service.MedicineService;
import com.zhijian.service.OrderService;
import com.zhijian.common.util.RedisUtil;
import com.zhijian.common.result.Result;
import com.zhijian.common.context.UserContext;
import com.zhijian.pojo.medicine.entity.Medicine;
import com.zhijian.pojo.Order;
import com.zhijian.dto.ai.AiChatResponseVO;
import com.zhijian.dto.medicine.MedicineQueryDTO;
import com.zhijian.dto.order.OrderQueryDTO;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
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
import java.util.stream.Collectors;

@Tag(name = "AI 导诊接口")
@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
@Slf4j
public class AiController {

    private final AiService aiService;
    private final MedicineService medicineService;
    private final OrderService orderService;
    private final RedisUtil redisUtil;
    private final ObjectMapper objectMapper;
    private final ExecutorService executorService = Executors.newCachedThreadPool();
    private static final long CHAT_HISTORY_TTL_HOURS = 24L;

    @Operation(summary = "AI对话 (普通)")
    @PostMapping("/chat")
    public Result<AiChatResponseVO> chat(@RequestBody ChatRequestDTO request) {
        Long currentUserId = UserContext.getUserId();
        String cozeUserId = currentUserId != null ? String.valueOf(currentUserId) : "guest_user";
        String userMessage = request.getMessage();
        
        AiContext context = buildContext(userMessage, currentUserId);
        String aiResponse = aiService.chat(context.systemPrompt, userMessage, cozeUserId);

        appendChatHistory(cozeUserId, buildUserHistoryMessage(userMessage), buildAiHistoryMessage(aiResponse, context.recommendations));
        
        return Result.success(new AiChatResponseVO(aiResponse, context.recommendations));
    }

    @Operation(summary = "AI对话 (流式)")
    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamChat(@RequestBody ChatRequestDTO request) {
        Long currentUserId = UserContext.getUserId();
        String cozeUserId = currentUserId != null ? String.valueOf(currentUserId) : "guest_user";
        String userMessage = request.getMessage();
        
        SseEmitter emitter = new SseEmitter(180000L); // 3 mins
        
        executorService.submit(() -> {
            AiContext context = null;
            StringBuilder fullAnswer = new StringBuilder();
            try {
                appendChatHistory(cozeUserId, buildUserHistoryMessage(userMessage));

                context = buildContext(userMessage, currentUserId);
                
                // 1. 如果有药品卡片，先发送 cards 事件
                if (context.recommendations != null && !context.recommendations.isEmpty()) {
                    try {
                        emitter.send(SseEmitter.event().name("cards").data(context.recommendations));
                    } catch (IOException e) {
                        log.debug("SSE send error: {}", e.getMessage());
                    }
                }
                
                // 2. 调用流式服务
                aiService.streamChat(context.systemPrompt, userMessage, cozeUserId, content -> {
                    try {
                        fullAnswer.append(content);
                        emitter.send(SseEmitter.event().name("message").data(content));
                    } catch (IOException e) {
                        log.debug("SSE send error: {}", e.getMessage());
                    }
                });

                // 3. 结束
                emitter.send(SseEmitter.event().name("done").data("[DONE]"));
                emitter.complete();
            } catch (Exception e) {
                log.error("Stream processing error", e);
                emitter.completeWithError(e);
            } finally {
                String aiText = fullAnswer.toString();
                if (!aiText.isBlank()) {
                    List<Medicine> cards = context != null ? context.recommendations : null;
                    appendChatHistory(cozeUserId, buildAiHistoryMessage(aiText, cards));
                }
            }
        });
        
        return emitter;
    }

    @Operation(summary = "查询AI聊天记录(24小时内)")
    @GetMapping("/history")
    public Result<List<ChatHistoryMessage>> history() {
        Long currentUserId = UserContext.getUserId();
        String userKey = currentUserId != null ? String.valueOf(currentUserId) : "guest_user";
        return Result.success(getChatHistory(userKey));
    }

    @Operation(summary = "清空AI聊天记录")
    @DeleteMapping("/history")
    public Result<Boolean> clearHistory() {
        Long currentUserId = UserContext.getUserId();
        String userKey = currentUserId != null ? String.valueOf(currentUserId) : "guest_user";
        return Result.success(Boolean.TRUE.equals(redisUtil.delete(chatHistoryKey(userKey))));
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    private static class AiContext {
        private String systemPrompt;
        private List<Medicine> recommendations;
    }

    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    private static class ChatHistoryMessage {
        private String id;
        private String text;
        private String sender;
        private long timestamp;
        private List<Medicine> recommendations;
    }

    private String chatHistoryKey(String userKey) {
        return "ai:chat:history:" + userKey;
    }

    private ChatHistoryMessage buildUserHistoryMessage(String userMessage) {
        return new ChatHistoryMessage(UUID.randomUUID().toString(), userMessage, "user", System.currentTimeMillis(), null);
    }

    private ChatHistoryMessage buildAiHistoryMessage(String aiText, List<Medicine> recommendations) {
        List<Medicine> cards = (recommendations == null || recommendations.isEmpty()) ? null : recommendations;
        return new ChatHistoryMessage(UUID.randomUUID().toString(), aiText, "ai", System.currentTimeMillis(), cards);
    }

    private List<ChatHistoryMessage> getChatHistory(String userKey) {
        String key = chatHistoryKey(userKey);
        String raw = redisUtil.get(key);
        if (raw == null || raw.isBlank()) return Collections.emptyList();
        try {
            return objectMapper.readValue(raw, new TypeReference<List<ChatHistoryMessage>>() {});
        } catch (Exception e) {
            log.warn("Failed to parse chat history for key {}", key, e);
            return Collections.emptyList();
        }
    }

    private void appendChatHistory(String userKey, ChatHistoryMessage... newMessages) {
        String key = chatHistoryKey(userKey);
        List<ChatHistoryMessage> existing = new ArrayList<>(getChatHistory(userKey));
        Collections.addAll(existing, newMessages);
        try {
            String json = objectMapper.writeValueAsString(existing);
            redisUtil.set(key, json, CHAT_HISTORY_TTL_HOURS, TimeUnit.HOURS);
        } catch (Exception e) {
            log.warn("Failed to write chat history for key {}", key, e);
        }
    }

    private AiContext buildContext(String userMessage, Long currentUserId) {
        log.info("Received User Message: {}", userMessage);

        // 0. 预判断：是否为明确的订单查询
        boolean isOrderQuery = userMessage.contains("订单") || userMessage.contains("物流") || 
                               userMessage.contains("快递") || userMessage.contains("发货") || 
                               userMessage.contains("买了") || userMessage.contains("买过");

        // 1. 尝试提取关键词（采用 规则匹配 + AI 提取 双重策略）
        // 如果明确是订单查询，则跳过AI关键词提取，节省资源
        String keywords = "NULL";
        String source = "AI";

        // A. 规则匹配（针对高频词进行兜底，确保演示稳定性）
        if (userMessage.contains("头痛") || userMessage.contains("头疼") || userMessage.toLowerCase().contains("headache")) keywords = "头痛";
        else if (userMessage.contains("感冒")) keywords = "感冒";
        else if (userMessage.contains("发烧") || userMessage.contains("发热")) keywords = "发烧";
        else if (userMessage.contains("腹痛") || userMessage.contains("肚子疼")) keywords = "腹痛";
        else if (userMessage.contains("阿莫西林")) keywords = "阿莫西林";
        else if (userMessage.contains("布洛芬")) keywords = "布洛芬";

        if (!"NULL".equals(keywords)) {
            source = "规则匹配";
        } else if (!isOrderQuery) { // 只有在不是订单查询的情况下，才尝试调用AI提取
            // B. AI 提取（如果规则没命中，且不是订单查询，再尝试 AI）
            String extractionPrompt = "Extract 1 core medical keyword (symptom, disease, or medicine) from the user input. Return ONLY the keyword. If no medical term is found, return 'NULL'.";
            String extractorId = "system_extractor_" + java.util.UUID.randomUUID().toString();
            keywords = aiService.chat(extractionPrompt, userMessage, extractorId);
        } else {
            source = "跳过(订单查询)";
        }
        
        log.info("Extracted Keywords: {} (Source: {})", keywords, source);

        List<Medicine> recommendations = Collections.emptyList();

        // 2. 如果提取到了关键词，进行搜索
        if (keywords != null && !keywords.toUpperCase().contains("NULL") && !keywords.trim().isEmpty()) {
            keywords = keywords.replace("。", "").replace(".", "").replace("'", "").replace("\"", "").trim();
            String searchKeyword = keywords.split("[,，]")[0].trim();
            log.info("Searching medicine with keyword: {}", searchKeyword);

            if (StrUtil.isNotBlank(searchKeyword)) {
                MedicineQueryDTO query = new MedicineQueryDTO();
                query.setKeyword(searchKeyword);
                query.setPage(1);
                query.setSize(3);
                IPage<Medicine> page = medicineService.pageList(query);
                recommendations = page.getRecords();
                log.info("Found {} medicines for keyword: {}", recommendations.size(), searchKeyword);
            }
        } else {
            log.info("No valid keywords extracted.");
        }

        // 3. 构建最终的AI提示词
        StringBuilder systemPromptBuilder = new StringBuilder();

        // 3.1 药品卡片上下文
        if (!recommendations.isEmpty()) {
            systemPromptBuilder.append("【系统提示】系统已在你的回复下方自动弹出了以下相关药品的购买链接卡片：\n");
            for (Medicine m : recommendations) {
                systemPromptBuilder.append("- ").append(m.getName()).append("\n");
            }
            systemPromptBuilder.append("\n请注意：你不需要在回复中详细列出药品参数或价格，也不要生成购买链接。");
            systemPromptBuilder.append("你只需要针对用户的症状给出建议，并自然地引导用户查看下方的药品卡片即可（例如：'为您推荐了相关药品，您可以点击下方卡片查看详情'）。\n\n");
        }

        // 3.2 订单上下文 (新增)
        if (currentUserId != null && isOrderQuery) {
             try {
                 OrderQueryDTO orderQuery = new OrderQueryDTO();
                 orderQuery.setPage(1);
                 orderQuery.setSize(3);
                 IPage<Order> orderPage = orderService.pageList(orderQuery, currentUserId);
                 List<Order> orders = orderPage.getRecords();
                 
                 if (orders != null && !orders.isEmpty()) {
                     systemPromptBuilder.append("【系统数据注入】检测到用户询问订单，以下是该用户最近的订单信息（仅供参考）：\n");
                     for (Order order : orders) {
                         String statusStr = "未知";
                         if (order.getStatus() != null) {
                             switch (order.getStatus()) {
                                 case 0: statusStr = "待支付"; break;
                                 case 1: statusStr = "待发货"; break;
                                 case 2: statusStr = "已发货"; break;
                                 case 3: statusStr = "已完成"; break;
                                 case 4: statusStr = "售后中"; break;
                                 case 5: statusStr = "已退款"; break;
                                 case -1: statusStr = "已取消"; break;
                             }
                         }
                         String itemNames = "未知商品";
                         if (order.getItems() != null && !order.getItems().isEmpty()) {
                            itemNames = order.getItems().stream()
                                .map(i -> i.getMedicineName() + "x" + i.getCount())
                                .collect(Collectors.joining(", "));
                        }
                         systemPromptBuilder.append(String.format("- 订单号：%s | 金额：￥%s | 状态：%s | 商品：%s\n", 
                             order.getOrderNo(), order.getPayAmount(), statusStr, itemNames));
                     }
                     systemPromptBuilder.append("请根据上述真实订单信息回答用户的问题。如果用户询问的订单不在列表中，请告知只能查询最近的订单。\n\n");
                 }
             } catch (Exception e) {
                 log.error("Failed to inject order context", e);
             }
        }

        String finalSystemPrompt = systemPromptBuilder.toString();
        if (finalSystemPrompt.isEmpty()) {
            finalSystemPrompt = "如果用户咨询处方药，请提醒用户需要医生处方。";
        }
        
        return new AiContext(finalSystemPrompt, recommendations);
    }
}

