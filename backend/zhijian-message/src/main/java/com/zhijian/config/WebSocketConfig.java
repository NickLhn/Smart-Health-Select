package com.zhijian.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.server.standard.ServerEndpointExporter;

/**
 * WebSocket 配置类。
 */
@Configuration
@Slf4j
public class WebSocketConfig {

    /**
     * 注册 WebSocket 端点导出器。
     *
     * @return ServerEndpointExporter 实例
     */
    @Bean
    public ServerEndpointExporter serverEndpointExporter() {
        // 该 Bean 会扫描并注册所有 @ServerEndpoint 端点。
        log.info("WebSocket已开启");
        return new ServerEndpointExporter();
    }
}
