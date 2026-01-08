package com.zhijian.common.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * 配送状态变更事件
 * 当订单配送状态发生变化时发布此事件
 *
 * @author Liuhaonan
 * @since 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryStatusEvent implements Serializable {

    /** 订单ID */
    private Long orderId;

    /** 配送记录ID */
    private Long deliveryId;

    /**
     * 配送状态
     * 1:配送中
     * 2:已送达
     */
    private Integer status;
}