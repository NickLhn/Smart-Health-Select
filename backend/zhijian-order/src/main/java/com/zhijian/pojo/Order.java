package com.zhijian.pojo;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 订单实体类。
 */
@Data
@TableName("oms_order")
public class Order implements Serializable {

    /**
     * 订单 ID。
     */
    @TableId
    private Long id;

    /**
     * 用户 ID。
     */
    private Long userId;

    /**
     * 商家 ID。
     */
    private Long sellerId;

    /**
     * 订单号。
     */
    private String orderNo;

    /**
     * 药品 ID。
     */
    @TableField(exist = false)
    private Long medicineId;

    /**
     * 药品名称。
     */
    @TableField(exist = false)
    private String medicineName;

    /**
     * 药品图片。
     */
    @TableField(exist = false)
    private String medicineImage;

    /**
     * 订单项列表。
     */
    @TableField(exist = false)
    private List<OrderItem> items;

    /**
     * 购买数量。
     */
    @TableField(exist = false)
    private Integer quantity;

    /**
     * 单价。
     */
    @TableField(exist = false)
    private BigDecimal price;

    /**
     * 商品总金额。
     */
    private BigDecimal totalAmount;

    /**
     * 优惠券抵扣金额。
     */
    private BigDecimal couponAmount;

    /**
     * 实付金额。
     */
    private BigDecimal payAmount;

    /**
     * 优惠券记录 ID。
     */
    private Long couponHistoryId;

    /**
     * 订单状态。
     */
    private Integer status;

    /**
     * 收货人姓名。
     */
    private String receiverName;

    /**
     * 收货人电话。
     */
    private String receiverPhone;

    /**
     * 收货地址。
     */
    private String receiverAddress;

    /**
     * 退款原因。
     */
    private String refundReason;

    /**
     * 退款备注。
     */
    private String refundRemark;

    /**
     * 审核不通过原因。
     */
    private String auditReason;

    /**
     * 处方图片。
     */
    private String prescriptionImage;

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

    /**
     * 支付时间。
     */
    @TableField("payment_time")
    private LocalDateTime payTime;

    /**
     * 发货时间。
     */
    private LocalDateTime deliveryTime;

    /**
     * 完成时间。
     */
    private LocalDateTime finishTime;

    /**
     * 评价状态。
     */
    private Integer commentStatus;

    /**
     * 就诊人 ID。
     */
    private Long patientId;

    /**
     * 药师审核状态。
     */
    @TableField("pharmacist_audit_status")
    private Integer auditStatus;
}
