package com.zhijian.listener;

import com.zhijian.common.event.DeliveryStatusEvent;
import com.zhijian.common.event.NotificationEvent;
import com.zhijian.pojo.Order;
import com.zhijian.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * 配送事件监听器。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DeliveryEventListener {

    /**
     * 订单业务服务。
     */
    private final OrderService orderService;

    /**
     * 应用事件发布器。
     */
    private final ApplicationEventPublisher eventPublisher;

    /**
     * 处理配送状态变更事件。
     *
     * @param event 配送状态事件
     */
    @Async
    @EventListener
    public void handleDeliveryStatusEvent(DeliveryStatusEvent event) {
        log.info("收到配送状态变更事件: {}", event);
        Order order = orderService.getById(event.getOrderId());
        if (order == null) {
            log.warn("订单不存在: {}", event.getOrderId());
            return;
        }

        String msg = "";
        String type = "";
        if (event.getStatus() == 1) {
            // 骑手接单后，订单状态同步推进为已发货。
            order.setStatus(2);
            order.setDeliveryTime(java.time.LocalDateTime.now());
            orderService.updateById(order);

            msg = "您的订单 " + order.getOrderNo() + " 已被骑手接单，正在配送中";
            type = "DELIVERY_ACCEPTED";
        } else if (event.getStatus() == 2) {
            // 送达后只做通知，收货确认仍由用户主动完成。
            msg = "您的订单 " + order.getOrderNo() + " 已送达，请尽快确认收货";
            type = "DELIVERY_ARRIVED";
        }

        if (!msg.isEmpty()) {
            eventPublisher.publishEvent(new NotificationEvent(
                    order.getUserId(),
                    msg,
                    type,
                    order.getId()
            ));
        }
    }
}
