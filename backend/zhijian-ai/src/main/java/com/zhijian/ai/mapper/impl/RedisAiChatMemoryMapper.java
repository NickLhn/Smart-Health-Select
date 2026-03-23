package com.zhijian.ai.mapper.impl;

import com.zhijian.ai.mapper.AiChatMemoryMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 基于 Redis 的 AI 对话历史存储实现。
 */
@Repository
@RequiredArgsConstructor
public class RedisAiChatMemoryMapper implements AiChatMemoryMapper {

    /**
     * Redis 操作模板。
     */
    private final StringRedisTemplate redis;

    /**
     * 加载指定会话的历史消息。
     *
     * @param conversationId 会话 ID
     * @param limit 返回条数上限
     * @return 历史消息列表
     */
    @Override
    public List<String> loadHistory(String conversationId, int limit) {
        String key = historyKey(conversationId);
        int safeLimit = Math.max(1, Math.min(limit, 500));
        return redis.opsForList().range(key, -safeLimit, -1);
    }

    /**
     * 清空指定会话的历史数据。
     *
     * @param conversationId 会话 ID
     * @return 清空结果
     */
    @Override
    public boolean clearConversation(String conversationId) {
        Boolean deletedHistory = redis.delete(historyKey(conversationId));
        Boolean deletedState = redis.delete(stateKey(conversationId));
        return Boolean.TRUE.equals(deletedHistory) || Boolean.TRUE.equals(deletedState);
    }

    /**
     * 构建历史消息存储键。
     *
     * @param conversationId 会话 ID
     * @return Redis 键
     */
    private String historyKey(String conversationId) {
        return "chat:history:" + conversationId;
    }

    /**
     * 构建对话状态存储键。
     *
     * @param conversationId 会话 ID
     * @return Redis 键
     */
    private String stateKey(String conversationId) {
        return "chat:state:" + conversationId;
    }
}
