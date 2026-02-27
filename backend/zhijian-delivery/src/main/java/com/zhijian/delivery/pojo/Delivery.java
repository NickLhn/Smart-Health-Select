package com.zhijian.delivery.pojo;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@TableName("oms_delivery")
public class Delivery implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    private Long orderId;

    private Long courierId;

    private String courierName;

    private String courierPhone;

    private String receiverName;

    private String receiverPhone;

    private String receiverAddress;

    private String shopName;

    private String shopAddress;

    private java.math.BigDecimal deliveryFee;

    private String proofImage;

    private Integer status;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    private Integer isUrgent;

    private String verifyCode;

    private Integer exceptionStatus;

    private String exceptionReason;
}
