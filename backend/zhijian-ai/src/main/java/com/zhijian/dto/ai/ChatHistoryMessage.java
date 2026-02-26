package com.zhijian.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ChatHistoryMessage {
    private String id;
    private String text;
    private String sender;
    private long timestamp;
    private Object recommendations;
}

