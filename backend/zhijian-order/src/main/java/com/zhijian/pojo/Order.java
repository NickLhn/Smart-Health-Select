package com.zhijian.pojo;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 订单实体类
 * 
 * @author Liuhaonan
 * @since 1.0.0
 */
@Data
@TableName("oms_order")
public class Order implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 用户ID
     */
    private Long userId;

    /**
     * 商家ID
     */
    private Long sellerId;

    /**
     * 订单号
     */
    private String orderNo;

    /**
     * 药品ID (非数据库字段，仅用于展示)
     */
    @TableField(exist = false)
    private Long medicineId;

    /**
     * 药品名称 (非数据库字段，仅用于展示)
     */
    @TableField(exist = false)
    private String medicineName;

    /**
     * 药品图片 (非数据库字段，仅用于展示)
     */
    @TableField(exist = false)
    private String medicineImage;

    /**
     * 订单项列表 (非数据库字段)
     */
    @TableField(exist = false)
    private List<OrderItem> items;

    /**
     * 购买数量 (非数据库字段，仅用于展示)
     */
    @TableField(exist = false)
    private Integer quantity;

    /**
     * 单价 (非数据库字段，仅用于展示)
     */
    @TableField(exist = false)
    private BigDecimal price;

    /**
     * 商品总金额
     */
    private BigDecimal totalAmount;

    /**
     * 优惠券抵扣金额
     */
    private BigDecimal couponAmount;

    /**
     * 实付金额
     */
    private BigDecimal payAmount;

    /**
     * 优惠券记录ID (UserCoupon ID)
     */
    private Long couponHistoryId;

    /**
     * 订单状态 (0:待支付 1:待发货 2:已发货 3:已完成 4:售后中 5:已退款 -1:已取消)
     */
    private Integer status;

    /**
     * 收货人姓名
     */
    private String receiverName;

    /**
     * 收货人电话
     */
    private String receiverPhone;

    /**
     * 收货地址
     */
    private String receiverAddress;

    /**
     * 退款原因
     */
    private String refundReason;

    /**
     * 退款备注 (商家)
     */
    private String refundRemark;

    /**
     * 审核不通过原因
     */
    private String auditReason;

    /**
     * 处方图片
     */
    private String prescriptionImage;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    /**
     * 支付时间
     */
    @TableField("payment_time")
    private LocalDateTime payTime;

    /**
     * 发货时间
     */
    private LocalDateTime deliveryTime;

    /**
     * 完成时间
     */
    private LocalDateTime finishTime;

    /**
     * 评价状态 (0:未评价 1:已评价)
     */
    private Integer commentStatus;

    /**
     * 就诊人ID
     */
    private Long patientId;

    /**
     * 审核状态: 0-无需审核 1-待审核 2-审核通过 3-审核拒绝
     */
    @TableField("pharmacist_audit_status")
    private Integer auditStatus;
}

