package com.zhijian.aftersales.pojo;

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
 * 退款申请实体类。
 */
@Data
@Accessors(chain = true)
@TableName("oms_refund_apply")
public class RefundApply implements Serializable {

    /**
     * 序列化版本号。
     */
    private static final long serialVersionUID = 1L;

    /**
     * 退款申请 ID。
     */
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /**
     * 关联订单 ID。
     */
    @TableField("order_id")
    private Long orderId;

    /**
     * 申请用户 ID。
     */
    @TableField("user_id")
    private Long userId;

    /**
     * 退款类型。
     */
    @TableField("type")
    private Integer type;

    /**
     * 退款原因。
     */
    @TableField("reason")
    private String reason;

    /**
     * 退款金额。
     */
    @TableField("amount")
    private BigDecimal amount;

    /**
     * 凭证图片。
     */
    @TableField("images")
    private String images;

    /**
     * 申请前的原始订单状态。
     */
    @TableField("original_order_status")
    private Integer originalOrderStatus;

    /**
     * 退款申请状态。
     */
    @TableField("status")
    private Integer status;

    /**
     * 审核时间。
     */
    @TableField("audit_time")
    private LocalDateTime auditTime;

    /**
     * 审核备注。
     */
    @TableField("audit_reason")
    private String auditReason;

    /**
     * 创建时间。
     */
    @TableField("create_time")
    private LocalDateTime createTime;

    /**
     * 更新时间。
     */
    @TableField("update_time")
    private LocalDateTime updateTime;

    /**
     * 订单编号，仅用于列表展示。
     */
    @TableField(exist = false)
    private String orderNo;

    /**
     * 用户名，仅用于列表展示。
     */
    @TableField(exist = false)
    private String username;
}
