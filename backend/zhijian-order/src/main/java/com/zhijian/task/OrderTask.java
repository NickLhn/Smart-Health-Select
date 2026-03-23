package com.zhijian.task;

import com.zhijian.service.OrderService;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * 订单定时任务。
 */
@Component
@Slf4j
public class OrderTask {

    /**
     * 订单业务服务。
     */
    @Resource
    private OrderService orderService;

    /**
     * 定时检查超时订单。
     */
    @Scheduled(cron = "0 * * * * ?")
    public void cancelTimeoutOrders() {
        orderService.checkAndCancelTimeoutOrders();
        log.info("定时处理超时订单{}", LocalDateTime.now());
    }
}
