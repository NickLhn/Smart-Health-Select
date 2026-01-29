package com.zhijian.pojo;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 支付记录实体类
 * 
 * @author Liuhaonan
 * @since 1.0.0
 */
@Data
@TableName("oms_payment_record")
public class PaymentRecord implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 订单ID
     */
    private Long orderId;

    /**
     * 用户ID
     */
    private Long userId;

    /**
     * 支付金额
     */
    private BigDecimal amount;

    /**
     * 支付方式: 1支付宝 2微信 3银行卡
     */
    private Integer paymentMethod;

    /**
     * 交易流水号 (第三方返回)
     */
    private String transactionId;

    /**
     * 支付状态: 0未支付 1支付成功 2支付失败
     */
    private Integer status;

    /**
     * 创建时间
     */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    /**
     * 更新时间
     */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}

