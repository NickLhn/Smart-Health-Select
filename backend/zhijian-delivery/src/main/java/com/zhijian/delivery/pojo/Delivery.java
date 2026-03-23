package com.zhijian.delivery.pojo;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 配送单实体类。
 */
@Data
@TableName("oms_delivery")
public class Delivery implements Serializable {

    /**
     * 序列化版本号。
     */
    private static final long serialVersionUID = 1L;

    /**
     * 配送单 ID。
     */
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /**
     * 订单 ID。
     */
    private Long orderId;

    /**
     * 骑手 ID。
     */
    private Long courierId;

    /**
     * 骑手姓名。
     */
    private String courierName;

    /**
     * 骑手手机号。
     */
    private String courierPhone;

    /**
     * 收货人姓名。
     */
    private String receiverName;

    /**
     * 收货人手机号。
     */
    private String receiverPhone;

    /**
     * 收货地址。
     */
    private String receiverAddress;

    /**
     * 店铺名称。
     */
    private String shopName;

    /**
     * 店铺地址。
     */
    private String shopAddress;

    /**
     * 配送费。
     */
    private java.math.BigDecimal deliveryFee;

    /**
     * 配送凭证图片。
     */
    private String proofImage;

    /**
     * 配送状态。
     */
    private Integer status;

    /**
     * 创建时间。
     */
    private LocalDateTime createTime;

    /**
     * 更新时间。
     */
    private LocalDateTime updateTime;

    /**
     * 是否急单。
     */
    private Integer isUrgent;

    /**
     * 配送核销码。
     */
    private String verifyCode;

    /**
     * 异常状态。
     */
    private Integer exceptionStatus;

    /**
     * 异常原因。
     */
    private String exceptionReason;
}
