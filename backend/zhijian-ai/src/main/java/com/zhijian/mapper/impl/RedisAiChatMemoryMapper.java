package com.zhijian.mapper.impl;

import com.zhijian.mapper.AiChatMemoryMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
@RequiredArgsConstructor
public class RedisAiChatMemoryMapper implements AiChatMemoryMapper {

    private final StringRedisTemplate redis;

    @Override
    public List<String> loadHistory(String conversationId, int limit) {
        String key = historyKey(conversationId);
        int safeLimit = Math.max(1, Math.min(limit, 500));
        return redis.opsForList().range(key, -safeLimit, -1);
    }

    @Override
    public boolean clearConversation(String conversationId) {
        Boolean deletedHistory = redis.delete(historyKey(conversationId));
        Boolean deletedState = redis.delete(stateKey(conversationId));
        return Boolean.TRUE.equals(deletedHistory) || Boolean.TRUE.equals(deletedState);
    }

    private String historyKey(String conversationId) {
        return "chat:history:" + conversationId;
    }

    private String stateKey(String conversationId) {
        return "chat:state:" + conversationId;
    }
}

