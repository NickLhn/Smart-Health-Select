package com.zhijian.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * AI 对话请求对象。
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AIChatRequest {

    /**
     * 用户消息内容。
     */
    private String message;
}
