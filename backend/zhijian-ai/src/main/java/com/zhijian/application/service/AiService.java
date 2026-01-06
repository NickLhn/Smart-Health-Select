package com.zhijian.application.service;

import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.data.message.SystemMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;

/**
 * AI服务类 - 负责处理健康咨询相关的AI对话
 * 使用LangChain4j框架集成OpenAI/DeepSeek等大语言模型
 * 提供医疗健康领域的智能问答服务
 */
@Service
@Slf4j
public class AiService {

    /** OpenAI API密钥，从配置文件中注入 */
    @Value("${zhijian.ai.openai.api-key}")
    private String apiKey;

    /** API基础URL，支持自定义端点（可用于DeepSeek等兼容OpenAI API的服务） */
    @Value("${zhijian.ai.openai.base-url}")
    private String baseUrl;

    /** 聊天语言模型实例，用于与AI模型交互 */
    private ChatLanguageModel chatModel;

    /**
     * 初始化方法 - 在Bean创建后自动执行
     * 根据配置初始化AI模型客户端
     */
    @PostConstruct
    public void init() {
        try {
            // 构建OpenAI兼容的聊天模型实例
            chatModel = OpenAiChatModel.builder()
                    .apiKey(apiKey)               // 设置API密钥
                    .baseUrl(baseUrl)             // 设置API端点地址
                    .modelName("deepseek-chat")   // 指定使用的模型名称
                    //.modelName("gemini-3-pro-preview")   // 指定使用的模型名称
                    .logRequests(true)            // 启用请求日志记录
                    .logResponses(true)           // 启用响应日志记录
                    .build();
            log.info("AI Model initialized successfully.");
        } catch (Exception e) {
            // 模型初始化失败处理
            log.error("Failed to initialize AI model", e);
        }
    }

    private String maskApiKey(String key) {
        if (key == null || key.length() <= 8) return "******";
        return key.substring(0, 4) + "..." + key.substring(key.length() - 4);
    }

    /**
     * 处理用户健康咨询的聊天请求
     *
     * @param userMessage 用户输入的健康咨询问题
     * @return AI生成的回答内容，或在演示模式下返回预设回复
     */
    public String chat(String userMessage) {
        return chat("你是一个专业的医疗健康助手，服务于'智健优选'平台。请用专业、亲切的语气回答用户的健康咨询问题。如果涉及处方药，请提醒用户需要医生处方。", userMessage);
    }

    /**
     * 处理带有自定义系统提示词的聊天请求
     *
     * @param systemPrompt 系统提示词
     * @param userMessage 用户消息
     * @return AI回复
     */
    public String chat(String systemPrompt, String userMessage) {
        // 演示模式处理：未配置API密钥时返回演示回复
        if (chatModel == null) {
            return "【演示模式】收到您的问题：" + userMessage +
                    "。建议您多喝热水，保持良好的作息。" +
                    "如需更专业的建议，请配置OpenAI API Key。";
        }

        try {
            // 调用AI模型生成回复
            return chatModel.generate(
                    // 系统消息：定义AI助手的角色和行为准则
                    SystemMessage.from(systemPrompt),
                    // 用户消息：传入用户的实际问题
                    UserMessage.from(userMessage)
            ).content().text();  // 提取文本回复内容
        } catch (Exception e) {
            // API调用异常处理
            log.error("AI chat error", e);
            return "AI服务暂时不可用，请稍后再试。";
        }
    }
}
