package com.zhijian.listener;

import com.zhijian.common.event.NotificationEvent;
import com.zhijian.ws.WebSocketServer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@RequiredArgsConstructor
public class NotificationListener {

    @Async
    @EventListener
    public void handleNotificationEvent(NotificationEvent event) {
        log.info("收到通知事件: {}", event);
        // 构建消息JSON (简化处理)
        String messageJson = String.format("{\"type\":\"%s\",\"content\":\"%s\",\"relationId\":%d}",
                event.getType(), event.getContent(), event.getRelationId());

        WebSocketServer.sendInfo(event.getUserId(), messageJson);
    }
}


