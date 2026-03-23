package com.zhijian.ai.mapper;

import java.util.List;

/**
 * AI 对话历史存储接口。
 */
public interface AiChatMemoryMapper {

    /**
     * 加载指定会话的历史消息。
     *
     * @param conversationId 会话 ID
     * @param limit 返回条数上限
     * @return 历史消息列表
     */
    List<String> loadHistory(String conversationId, int limit);

    /**
     * 清空指定会话的历史数据。
     *
     * @param conversationId 会话 ID
     * @return 清空结果
     */
    boolean clearConversation(String conversationId);
}
