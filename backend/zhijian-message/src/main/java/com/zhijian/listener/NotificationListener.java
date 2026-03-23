package com.zhijian.listener;

import com.zhijian.common.event.NotificationEvent;
import com.zhijian.ws.WebSocketServer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * 通知事件监听器。
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class NotificationListener {

    /**
     * 处理通知事件。
     *
     * @param event 通知事件
     */
    @Async
    @EventListener
    public void handleNotificationEvent(NotificationEvent event) {
        log.info("收到通知事件: {}", event);
        // 这里统一拼接推送消息结构，前端直接按 type/content/relationId 解析。
        String messageJson = String.format("{\"type\":\"%s\",\"content\":\"%s\",\"relationId\":%d}",
                event.getType(), event.getContent(), event.getRelationId());

        WebSocketServer.sendInfo(event.getUserId(), messageJson);
    }
}
