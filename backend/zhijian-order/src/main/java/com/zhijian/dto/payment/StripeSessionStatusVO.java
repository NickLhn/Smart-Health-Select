package com.zhijian.dto.payment;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/**
 * Stripe Session 状态视图。
 */
@Data
public class StripeSessionStatusVO {

    /**
     * Session ID。
     */
    private String sessionId;

    /**
     * 支付批次号。
     */
    private String batchNo;

    /**
     * 批次状态。
     */
    private Integer status;

    /**
     * 第三方支付状态。
     */
    private String providerStatus;

    /**
     * 页面展示用支付状态。
     */
    private String paymentStatus;

    /**
     * 金额。
     */
    private BigDecimal amount;

    /**
     * 币种。
     */
    private String currency;

    /**
     * 包含的订单 ID。
     */
    private List<Long> orderIds;
}
