package com.zhijian.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Stripe 沙盒支付配置。
 */
@Data
@Component
@ConfigurationProperties(prefix = "stripe")
public class StripeProperties {

    /**
     * Stripe Secret Key。
     */
    private String secretKey;

    /**
     * Stripe Publishable Key。
     */
    private String publishableKey;

    /**
     * Webhook 验签密钥。
     */
    private String webhookSecret;

    /**
     * 默认币种。
     */
    private String currency = "cny";

    /**
     * 支付成功跳转地址。
     */
    private String successUrl;

    /**
     * 支付取消跳转地址。
     */
    private String cancelUrl;
}
