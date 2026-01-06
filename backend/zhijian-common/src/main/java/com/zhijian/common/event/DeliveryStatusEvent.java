package com.zhijian.common.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * 配送状态变更事件
 *
 * @author Liuhaonan
 * @since 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryStatusEvent implements Serializable {
    private Long orderId;
    private Long deliveryId;
    private Integer status; // 1:配送中 2:已送达
}
