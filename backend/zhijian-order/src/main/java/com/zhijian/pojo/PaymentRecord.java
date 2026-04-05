package com.zhijian.pojo;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 支付记录实体类。
 */
@Data
@TableName("oms_payment_record")
public class PaymentRecord implements Serializable {

    /**
     * 支付记录 ID。
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 订单 ID。
     */
    private Long orderId;

    /**
     * 用户 ID。
     */
    private Long userId;

    /**
     * 支付金额。
     */
    private BigDecimal amount;

    /**
     * 支付方式。
     */
    private Integer paymentMethod;

    /**
     * 支付渠道。
     */
    private String provider;

    /**
     * 交易流水号。
     */
    private String transactionId;

    /**
     * Stripe Checkout Session ID。
     */
    private String checkoutSessionId;

    /**
     * Stripe PaymentIntent ID。
     */
    private String paymentIntentId;

    /**
     * 支付状态。
     */
    private Integer status;

    /**
     * 第三方支付状态。
     */
    private String providerStatus;

    /**
     * 币种。
     */
    private String currency;

    /**
     * 第三方 webhook 事件 ID。
     */
    private String webhookEventId;

    /**
     * 备注。
     */
    private String remark;

    /**
     * 创建时间。
     */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    /**
     * 更新时间。
     */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
