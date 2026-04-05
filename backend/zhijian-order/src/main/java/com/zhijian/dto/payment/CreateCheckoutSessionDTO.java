package com.zhijian.dto.payment;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

/**
 * 创建 Stripe Checkout Session 请求。
 */
@Data
public class CreateCheckoutSessionDTO {

    /**
     * 待支付订单 ID 列表。
     */
    @NotEmpty(message = "请选择要支付的订单")
    private List<String> orderIds;
}
