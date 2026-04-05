package com.zhijian.service;

import com.zhijian.dto.payment.CheckoutSessionVO;
import com.zhijian.dto.payment.StripeSessionStatusVO;

import java.util.List;

/**
 * Stripe 支付服务接口。
 */
public interface StripePaymentService {

    /**
     * 创建 Stripe Checkout Session。
     */
    CheckoutSessionVO createCheckoutSession(List<String> orderIds, Long userId);

    /**
     * 处理 Stripe webhook。
     */
    void handleWebhook(String payload, String signatureHeader);

    /**
     * 查询 Session 状态。
     */
    StripeSessionStatusVO getSessionStatus(String sessionId, Long userId);
}
