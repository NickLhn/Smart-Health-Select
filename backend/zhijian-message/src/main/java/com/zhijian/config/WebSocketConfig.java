package com.zhijian.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.server.standard.ServerEndpointExporter;

/**
 * WebSocket 配置类
 * 用于启用和配置WebSocket服务端端点
 *
 * @author Liuhaonan
 * @since 1.0.0
 */
@Configuration
@Slf4j
public class WebSocketConfig {

    /**
     * 注册ServerEndpointExporter Bean
     * 该Bean会自动扫描并注册带有@ServerEndpoint注解的类为WebSocket端点
     *
     * @return ServerEndpointExporter实例
     */
    @Bean
    public ServerEndpointExporter serverEndpointExporter() {
        // 创建ServerEndpointExporter实例
        // 作用：扫描所有带有@ServerEndpoint注解的类，将其注册为WebSocket端点
        // 这样客户端就能通过WebSocket协议连接到这些端点
        log.info("WebSocket已开启");
        return new ServerEndpointExporter();
    }
}


