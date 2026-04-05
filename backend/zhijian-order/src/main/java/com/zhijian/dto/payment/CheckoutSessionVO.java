package com.zhijian.dto.payment;

import lombok.Data;

/**
 * Stripe Checkout Session 返回值。
 */
@Data
public class CheckoutSessionVO {

    /**
     * 支付批次号。
     */
    private String batchNo;

    /**
     * Session ID。
     */
    private String sessionId;

    /**
     * 跳转地址。
     */
    private String url;
}
