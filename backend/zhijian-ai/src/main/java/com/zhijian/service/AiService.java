package com.zhijian.service;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.zhijian.common.util.RedisUtil;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * AI服务类 - 对接 Coze (扣子) 智能体 API
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class AiService {

    private final RedisUtil redisUtil;

    /**
     * Coze API访问令牌，从配置文件注入
     * 格式：Bearer token格式的认证令牌
     */
    @Value("${zhijian.ai.coze.api-token}")
    private String apiToken;

    /**
     * Coze机器人ID (用户端)，从配置文件注入
     */
    @Value("${zhijian.ai.coze.bot-id}")
    private String botId;

    /**
     * Coze机器人ID (商家端)，从配置文件注入
     */
    @Value("${zhijian.ai.coze.merchant-bot-id:}")
    private String merchantBotId;

    /**
     * HTTP客户端，用于调用Coze API
     * 配置了合理的超时时间以支持长对话
     */
    private OkHttpClient client;

    /**
     * Redis Key 前缀
     */
    private static final String COZE_CONVERSATION_KEY_PREFIX = "ai:coze:conversation:";

    /**
     * 初始化方法，在Bean创建后自动调用
     *
     * <p>执行顺序：</p>
     * 1. 初始化OkHttp客户端
     * 2. 记录初始化日志
     */
    @PostConstruct
    public void init() {
        // 配置HTTP客户端，设置合理的超时时间
        this.client = new OkHttpClient.Builder()
                .connectTimeout(30, TimeUnit.SECONDS)      // 连接超时：30秒
                .writeTimeout(30, TimeUnit.SECONDS)        // 写入超时：30秒
                .readTimeout(60, TimeUnit.SECONDS)         // 读取超时：60秒（支持长对话）
                .build();

        // 记录初始化成功日志
        log.info("Coze AI 服务初始化成功。用户BotID：{}，商家BotID：{}", botId, merchantBotId);
    }

    /**
     * 简易对话接口（无用户ID）
     *
     * @param systemPrompt 系统提示词，指导AI行为（可选）
     * @param userMessage  用户输入消息
     * @return AI回复内容
     */
    public String chat(String systemPrompt, String userMessage) {
        // 为匿名用户生成临时ID
        String tempUserId = "guest_" + UUID.randomUUID().toString().substring(0, 8);
        return chat(systemPrompt, userMessage, tempUserId);
    }

    /**
     * 完整对话接口（指定用户ID，默认使用用户端Bot）
     *
     * @param systemPrompt 系统提示词
     * @param userMessage  用户输入消息
     * @param userId       用户唯一标识
     * @return AI回复内容
     */
    public String chat(String systemPrompt, String userMessage, String userId) {
        return chat(systemPrompt, userMessage, userId, this.botId);
    }

    /**
     * 完整对话接口（指定Bot ID）
     */
    public String chat(String systemPrompt, String userMessage, String userId, String targetBotId) {
        // 使用StringBuilder收集流式响应
        final StringBuilder resultBuilder = new StringBuilder();

        // 调用流式对话接口
        streamChat(systemPrompt, userMessage, userId, targetBotId, resultBuilder::append);

        // 获取完整回复
        String result = resultBuilder.toString();

        // 处理空回复情况
        if (result.isEmpty()) {
            return "AI 似乎在思考，但没有说话...";
        }

        return result;
    }

    /**
     * 流式对话接口（默认使用用户端Bot）
     */
    public void streamChat(String systemPrompt, String userMessage, String userId, java.util.function.Consumer<String> onNext) {
        streamChat(systemPrompt, userMessage, userId, this.botId, onNext);
    }

    /**
     * 商家端流式对话接口
     */
    public void streamChatMerchant(String systemPrompt, String userMessage, String userId, java.util.function.Consumer<String> onNext) {
        String targetId = (merchantBotId != null && !merchantBotId.isEmpty()) ? merchantBotId : this.botId;
        streamChat(systemPrompt, userMessage, userId, targetId, onNext);
    }

    /**
     * 流式对话接口（核心方法，支持指定Bot）
     *
     * <p>使用Server-Sent Events (SSE) 技术实时接收AI回复</p>
     *
     * @param systemPrompt 系统提示词
     * @param userMessage  用户输入消息
     * @param userId       用户唯一标识
     * @param targetBotId  目标Bot ID
     * @param onNext       回调函数
     */
    public void streamChat(String systemPrompt, String userMessage, String userId, String targetBotId, java.util.function.Consumer<String> onNext) {
        // Coze V3 API 端点
        String url = "https://api.coze.cn/v3/chat";

        // 构造请求参数
        Map<String, Object> payload = new HashMap<>();
        payload.put("bot_id", targetBotId);                   // 机器人ID

        // 处理用户ID：确保不为空且为字符串类型
        String finalUserId = (userId != null && !userId.isEmpty()) ?
                userId :
                "guest_" + UUID.randomUUID().toString().substring(0, 8);
        payload.put("user_id", finalUserId);            // 用户ID

        payload.put("stream", true);                    // 启用流式传输
        payload.put("auto_save_history", true);         // 自动保存历史

        // 尝试从 Redis 获取已有的会话ID (区分 Bot)
        String convKey = COZE_CONVERSATION_KEY_PREFIX + targetBotId + ":" + finalUserId;
        String conversationId = redisUtil.get(convKey);
        if (conversationId != null) {
            payload.put("conversation_id", conversationId);
            log.debug("继续对话：{} 用户：{}", conversationId, finalUserId);
        }

        // 构造消息内容
        Map<String, String> message = new HashMap<>();
        message.put("role", "user");                    // 角色：用户
        message.put("content_type", "text");            // 内容类型：文本

        // 组合最终消息内容：用户消息 + 系统提示词
        // 注意：系统提示词放在后面，避免影响FAQ生成的问题字段
        String finalContent = userMessage;
        if (systemPrompt != null && !systemPrompt.isEmpty()) {
            finalContent = userMessage + "\n\n" + systemPrompt;
        }
        message.put("content", finalContent);           // 消息内容

        // 将消息添加到请求参数
        payload.put("additional_messages", new Object[]{message});

        // 创建请求体
        RequestBody body = RequestBody.create(
                JSON.toJSONString(payload),
                MediaType.parse("application/json; charset=utf-8")
        );

        // 调试日志（生产环境可调整级别）
        log.debug("Coze API 调用参数 - URL: {}，BotID: {}，UserID: {}",
                url, targetBotId, finalUserId);

        // 构造HTTP请求
        Request request = new Request.Builder()
                .url(url)
                .addHeader("Authorization", "Bearer " + apiToken)  // 认证头
                .addHeader("Content-Type", "application/json")      // 内容类型
                .post(body)
                .build();

        // 执行HTTP请求
        try (Response response = client.newCall(request).execute()) {
            // 检查响应状态
            if (!response.isSuccessful()) {
                String errorBody = response.body() != null ? response.body().string() : "null";
                log.error("Coze API 调用失败。状态：{}，内容：{}", response.code(), errorBody);
                onNext.accept("AI 服务暂时不可用 (Coze API Error: " + response.code() + ")");
                return;
            }

            log.debug("Coze API 连接已建立。开始读取流...");

            // 读取SSE流
            BufferedReader reader = new BufferedReader(response.body().charStream());
            String line;
            String currentEvent = null;  // 当前事件类型

            while ((line = reader.readLine()) != null) {
                if (line.startsWith("event:")) {
                    // 解析事件类型
                    currentEvent = line.substring(6).trim();
                } else if (line.startsWith("data:")) {
                    String data = line.substring(5).trim();

                    // 流结束标记
                    if ("[DONE]".equals(data)) break;

                    // 处理会话创建事件
                    if ("conversation.chat.created".equals(currentEvent)) {
                        try {
                            JSONObject json = JSON.parseObject(data);
                            String newConvId = json.getString("conversation_id");
                            if (newConvId != null) {
                                // 保存新的会话ID到 Redis，有效期 30 天
                                redisUtil.set(convKey, newConvId, 30, TimeUnit.DAYS);
                                log.debug("已将 conversation_id {} 绑定到用户 {} (Redis)", newConvId, finalUserId);
                            }
                        } catch (Exception e) {
                            log.warn("解析 conversation.chat.created 事件失败", e);
                        }
                    }

                    // 处理消息增量事件（AI回复片段）
                    if ("conversation.message.delta".equals(currentEvent)) {
                        try {
                            JSONObject json = JSON.parseObject(data);
                            String type = json.getString("type");      // 消息类型
                            String content = json.getString("content"); // 消息内容

                            // 只处理answer类型的消息，过滤function_call等
                            if ("answer".equals(type) && content != null) {
                                onNext.accept(content);  // 调用回调函数
                            }
                        } catch (Exception e) {
                            log.warn("delta 数据的 JSON 解析错误: {}", data);
                        }
                    }
                }
                // 空行表示事件块的结束，SSE规范要求
            }

            log.debug("Coze API 流已为用户完成: {}", finalUserId);

        } catch (IOException e) {
            log.error("调用 Coze API 时发生网络错误", e);
            onNext.accept("网络连接异常，请稍后再试");
        }
    }
}
