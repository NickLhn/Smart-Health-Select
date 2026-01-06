package com.zhijian.domain.aftersales.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.experimental.Accessors;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * <p>
 * 售后/退款申请表
 * </p>
 *
 * @author zhijian
 * @since 2025-12-28
 */
@Data
@Accessors(chain = true)
@TableName("oms_refund_apply")
public class RefundApply implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /**
     * 订单ID
     */
    @TableField("order_id")
    private Long orderId;

    /**
     * 用户ID
     */
    @TableField("user_id")
    private Long userId;

    /**
     * 类型: 1仅退款 2退货退款
     */
    @TableField("type")
    private Integer type;

    /**
     * 退款原因
     */
    @TableField("reason")
    private String reason;

    /**
     * 退款金额
     */
    @TableField("amount")
    private BigDecimal amount;

    /**
     * 凭证图片(JSON数组)
     */
    @TableField("images")
    private String images;

    /**
     * 原订单状态
     */
    @TableField("original_order_status")
    private Integer originalOrderStatus;

    /**
     * 状态: 0待审核 1审核通过 2审核拒绝
     */
    @TableField("status")
    private Integer status;

    /**
     * 审核时间
     */
    @TableField("audit_time")
    private LocalDateTime auditTime;

    /**
     * 审核备注
     */
    @TableField("audit_reason")
    private String auditReason;

    @TableField("create_time")
    private LocalDateTime createTime;

    @TableField("update_time")
    private LocalDateTime updateTime;

    @TableField(exist = false)
    private String orderNo;

    @TableField(exist = false)
    private String username;
}
