package com.zhijian.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * AI 对话历史消息对象。
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ChatHistoryMessage {

    /**
     * 消息 ID。
     */
    private String id;

    /**
     * 消息文本内容。
     */
    private String text;

    /**
     * 发送方标识。
     */
    private String sender;

    /**
     * 消息时间戳。
     */
    private long timestamp;

    /**
     * 推荐卡片数据。
     */
    private Object recommendations;
}
