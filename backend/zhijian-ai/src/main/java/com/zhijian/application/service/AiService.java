package com.zhijian.application.service;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

/**
 * AI服务类 - 对接 Coze (扣子) 智能体 API
 */
@Service
@Slf4j
public class AiService {

    /**
     * Coze API访问令牌，从配置文件注入
     * 格式：Bearer token格式的认证令牌
     */
    @Value("${zhijian.ai.coze.api-token}")
    private String apiToken;

    /**
     * Coze机器人ID，从配置文件注入
     * 用于指定要调用的具体智能体
     */
    @Value("${zhijian.ai.coze.bot-id}")
    private String botId;

    /**
     * HTTP客户端，用于调用Coze API
     * 配置了合理的超时时间以支持长对话
     */
    private OkHttpClient client;

    /**
     * 用户会话映射表
     * Key: 用户ID (String)
     * Value: Coze会话ID (String)
     *
     * <p>使用ConcurrentHashMap确保线程安全</p>
     */
    private final Map<String, String> userConversationMap = new ConcurrentHashMap<>();

    /**
     * 会话持久化文件路径
     * 用于在服务重启后恢复用户会话上下文
     */
    private static final String CONVERSATION_FILE = "coze_conversations.json";

    /**
     * 初始化方法，在Bean创建后自动调用
     *
     * <p>执行顺序：</p>
     * 1. 初始化OkHttp客户端
     * 2. 从文件加载历史会话
     * 3. 记录初始化日志
     */
    @PostConstruct
    public void init() {
        // 配置HTTP客户端，设置合理的超时时间
        this.client = new OkHttpClient.Builder()
                .connectTimeout(30, TimeUnit.SECONDS)      // 连接超时：30秒
                .writeTimeout(30, TimeUnit.SECONDS)        // 写入超时：30秒
                .readTimeout(60, TimeUnit.SECONDS)         // 读取超时：60秒（支持长对话）
                .build();

        // 加载历史会话信息
        loadConversations();

        // 记录初始化成功日志
        log.info("Coze AI 服务初始化成功。机器人 ID：{}", botId);
    }

    /**
     * 从本地文件加载历史会话信息
     *
     * <p>当文件不存在或读取失败时，会记录警告日志但不影响服务启动</p>
     */
    private void loadConversations() {
        try {
            File file = new File(CONVERSATION_FILE);
            if (file.exists()) {
                // 读取文件内容
                String content = new String(Files.readAllBytes(file.toPath()));
                // 解析JSON到Map
                JSONObject json = JSON.parseObject(content);
                for (String key : json.keySet()) {
                    userConversationMap.put(key, json.getString(key));
                }
                log.info("已从文件加载 {} 条对话：{}", userConversationMap.size(), CONVERSATION_FILE);
            } else {
                log.info("未找到对话文件：{}，保存时将创建新文件。", CONVERSATION_FILE);
            }
        } catch (Exception e) {
            // 文件加载失败不影响主要功能，仅记录警告
            log.warn("无法从文件加载对话：{}", e.getMessage());
        }
    }

    /**
     * 保存当前会话信息到本地文件
     *
     * <p>将会话Map序列化为JSON格式保存到文件</p>
     */
    private void saveConversations() {
        try {
            // 将会话Map转换为JSON字符串
            String json = JSON.toJSONString(userConversationMap);
            // 写入文件
            Files.write(Paths.get(CONVERSATION_FILE), json.getBytes());
            log.debug("已将 {} 个对话保存到文件：{}", userConversationMap.size(), CONVERSATION_FILE);
        } catch (Exception e) {
            // 保存失败不影响主要功能，仅记录警告
            log.warn("保存对话到文件失败：{}", e.getMessage());
        }
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
     * 完整对话接口（指定用户ID）
     *
     * @param systemPrompt 系统提示词，指导AI行为（可选）
     * @param userMessage  用户输入消息
     * @param userId       用户唯一标识，用于维护会话上下文
     * @return AI回复内容
     */
    public String chat(String systemPrompt, String userMessage, String userId) {
        // 使用StringBuilder收集流式响应
        final StringBuilder resultBuilder = new StringBuilder();

        // 调用流式对话接口，通过append方法收集响应片段
        streamChat(systemPrompt, userMessage, userId, resultBuilder::append);

        // 获取完整回复
        String result = resultBuilder.toString();

        // 处理空回复情况
        if (result.isEmpty()) {
            return "AI 似乎在思考，但没有说话...";
        }

        return result;
    }

    /**
     * 流式对话接口（核心方法）
     *
     * <p>使用Server-Sent Events (SSE) 技术实时接收AI回复</p>
     *
     * @param systemPrompt 系统提示词，指导AI行为（可选）
     * @param userMessage  用户输入消息
     * @param userId       用户唯一标识
     * @param onNext       回调函数，接收AI回复的每个片段
     */
    public void streamChat(String systemPrompt, String userMessage, String userId, java.util.function.Consumer<String> onNext) {
        // Coze V3 API 端点
        String url = "https://api.coze.cn/v3/chat";

        // 构造请求参数
        Map<String, Object> payload = new HashMap<>();
        payload.put("bot_id", botId);                   // 机器人ID

        // 处理用户ID：确保不为空且为字符串类型
        String finalUserId = (userId != null && !userId.isEmpty()) ?
                userId :
                "guest_" + UUID.randomUUID().toString().substring(0, 8);
        payload.put("user_id", finalUserId);            // 用户ID

        payload.put("stream", true);                    // 启用流式传输
        payload.put("auto_save_history", true);         // 自动保存历史

        // 尝试获取已有的会话ID，实现连续对话
        String conversationId = userConversationMap.get(finalUserId);
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
                url, botId, finalUserId);

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
                                // 保存新的会话ID
                                userConversationMap.put(finalUserId, newConvId);
                                log.debug("已将 conversation_id {} 绑定到用户 {}", newConvId, finalUserId);
                                saveConversations();  // 持久化到文件
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