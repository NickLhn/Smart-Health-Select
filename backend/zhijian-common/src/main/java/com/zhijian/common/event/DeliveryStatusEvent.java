package com.zhijian.common.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * 配送状态变更事件。
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryStatusEvent implements Serializable {

    /**
     * 订单 ID。
     */
    private Long orderId;

    /**
     * 配送记录 ID。
     */
    private Long deliveryId;

    /**
     * 配送状态。
     */
    private Integer status;
}
