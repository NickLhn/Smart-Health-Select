package com.zhijian.common.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * 通知事件。
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationEvent implements Serializable {

    /**
     * 接收者 ID。
     */
    private Long userId;

    /**
     * 消息内容。
     */
    private String content;

    /**
     * 消息类型。
     */
    private String type;

    /**
     * 关联 ID。
     */
    private Long relationId;
}
