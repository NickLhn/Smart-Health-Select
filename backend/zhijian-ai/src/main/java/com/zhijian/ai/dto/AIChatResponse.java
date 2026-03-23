package com.zhijian.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * AI 对话响应对象。
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class AIChatResponse {

    /**
     * AI 回复文本。
     */
    private String text;

    /**
     * 推荐卡片数据。
     */
    private Object recommendations;

    /**
     * 前端动作指令。
     */
    private Object action;
}
