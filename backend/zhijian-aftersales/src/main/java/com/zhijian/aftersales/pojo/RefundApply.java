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

@Data
@Accessors(chain = true)
@TableName("oms_refund_apply")
public class RefundApply implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    @TableField("order_id")
    private Long orderId;

    @TableField("user_id")
    private Long userId;

    @TableField("type")
    private Integer type;

    @TableField("reason")
    private String reason;

    @TableField("amount")
    private BigDecimal amount;

    @TableField("images")
    private String images;

    @TableField("original_order_status")
    private Integer originalOrderStatus;

    @TableField("status")
    private Integer status;

    @TableField("audit_time")
    private LocalDateTime auditTime;

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
