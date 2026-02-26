package com.zhijian.mapper;

import java.util.List;

public interface AiChatMemoryMapper {
    List<String> loadHistory(String conversationId, int limit);

    boolean clearConversation(String conversationId);
}

