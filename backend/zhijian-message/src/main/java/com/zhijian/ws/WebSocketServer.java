package com.zhijian.ws;

import jakarta.websocket.OnClose;
import jakarta.websocket.OnError;
import jakarta.websocket.OnMessage;
import jakarta.websocket.OnOpen;
import jakarta.websocket.Session;
import jakarta.websocket.server.PathParam;
import jakarta.websocket.server.ServerEndpoint;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;

/**
 * WebSocket 服务端点。
 */
@ServerEndpoint("/ws/{userId}")
@Component
@Slf4j
public class WebSocketServer {

    /**
     * 用户 WebSocket 会话池。
     */
    private static final ConcurrentHashMap<Long, Session> sessionPool = new ConcurrentHashMap<>();

    /**
     * 建立 WebSocket 连接。
     *
     * @param session WebSocket 会话
     * @param userId 用户 ID
     */
    @OnOpen
    public void onOpen(Session session, @PathParam(value = "userId") Long userId) {
        // 同一用户建立新连接时直接覆盖旧会话。
        sessionPool.put(userId, session);
    }

    /**
     * 关闭 WebSocket 连接。
     *
     * @param userId 用户 ID
     */
    @OnClose
    public void onClose(@PathParam(value = "userId") Long userId) {
        sessionPool.remove(userId);
    }

    /**
     * 处理 WebSocket 异常。
     *
     * @param session WebSocket 会话
     * @param error 异常对象
     */
    @OnError
    public void onError(Session session, Throwable error) {
        log.error("WebSocket发生错误", error);
    }

    /**
     * 接收客户端消息。
     *
     * @param message 消息内容
     */
    @OnMessage
    public void onMessage(String message) {
        log.info("收到客户端消息: {}", message);
    }

    /**
     * 向指定用户推送消息。
     *
     * @param userId 用户 ID
     * @param message 消息内容
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
            // 用户不在线时直接跳过，不把消息持久化到 WebSocket 层。
        }
    }
}
