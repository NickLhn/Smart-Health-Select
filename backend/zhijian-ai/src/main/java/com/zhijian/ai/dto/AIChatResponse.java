package com.zhijian.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AIChatResponse {
    private String text;
    private Object recommendations;
    private Object action;
}
