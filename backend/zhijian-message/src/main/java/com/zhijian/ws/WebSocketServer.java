package com.zhijian.ws;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import jakarta.websocket.*;
import jakarta.websocket.server.PathParam;
import jakarta.websocket.server.ServerEndpoint;
import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;

/**
 * WebSocket服务
 */
@ServerEndpoint("/ws/{userId}")
@Component
@Slf4j
public class WebSocketServer {

    /**
     * 存放每个客户端对应的WebSocket对象
     */
    private static ConcurrentHashMap<Long, Session> sessionPool = new ConcurrentHashMap<>();

    @OnOpen
    public void onOpen(Session session, @PathParam(value = "userId") Long userId) {
        sessionPool.put(userId, session);
    }

    @OnClose
    public void onClose(@PathParam(value = "userId") Long userId) {
        sessionPool.remove(userId);
    }

    @OnError
    public void onError(Session session, Throwable error) {
        log.error("WebSocket发生错误", error);
    }

    @OnMessage
    public void onMessage(String message) {
        log.info("收到客户端消息: {}", message);
    }

    /**
     * 发送消息
     */
    public static void sendInfo(Long userId, String message) {
        Session session = sessionPool.get(userId);
        if (session != null && session.isOpen()) {
            try {
                session.getBasicRemote().sendText(message);
                log.info("推送消息给用户: {}, 内容: {}", userId, message);
            } catch (IOException e) {
                log.error("推送消息失败", e);
            }
        } else {
            // log.warn("用户不在线，消息未推送: {}", userId);
        }
    }
}


