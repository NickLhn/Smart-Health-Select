package com.zhijian.pojo;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 支付批次实体。
 */
@Data
@TableName("oms_payment_batch")
public class PaymentBatch implements Serializable {

    /**
     * 批次 ID。
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 批次号。
     */
    private String batchNo;

    /**
     * 用户 ID。
     */
    private Long userId;

    /**
     * 订单 ID 列表 JSON。
     */
    private String orderIdsJson;

    /**
     * 支付金额。
     */
    private BigDecimal amount;

    /**
     * 币种。
     */
    private String currency;

    /**
     * 支付渠道。
     */
    private String provider;

    /**
     * 第三方支付状态。
     */
    private String providerStatus;

    /**
     * Checkout Session ID。
     */
    private String checkoutSessionId;

    /**
     * PaymentIntent ID。
     */
    private String paymentIntentId;

    /**
     * 状态：0待支付 1已支付 2已取消 3已过期 4支付失败。
     */
    private Integer status;

    /**
     * 第三方 webhook 事件 ID。
     */
    private String webhookEventId;

    /**
     * 过期时间。
     */
    private LocalDateTime expireTime;

    /**
     * 支付完成时间。
     */
    private LocalDateTime paidTime;

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
