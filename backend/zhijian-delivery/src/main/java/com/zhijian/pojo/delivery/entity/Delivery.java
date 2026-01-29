package com.zhijian.pojo.delivery.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 配送单实体
 *
 * @author Liuhaonan
 * @since 1.0.0
 */
@Data
@TableName("oms_delivery")
public class Delivery implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 主键ID
     */
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /**
     * 订单ID
     */
    private Long orderId;

    /**
     * 骑手ID
     */
    private Long courierId;

    /**
     * 骑手姓名
     */
    private String courierName;

    /**
     * 骑手电话
     */
    private String courierPhone;

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
     * 店铺名称 (快照)
     */
    private String shopName;

    /**
     * 店铺地址 (快照)
     */
    private String shopAddress;

    /**
     * 配送费 (骑手收入)
     */
    private java.math.BigDecimal deliveryFee;

    /**
     * 送达凭证 (图片URL)
     */
    private String proofImage;

    /**
     * 配送状态: 0待接单 1配送中 2已送达 3已取消
     */
    private Integer status;

    /**
     * 创建时间
     */
    private LocalDateTime createTime;

    /**
     * 更新时间
     */
    private LocalDateTime updateTime;

    /**
     * 是否急单: 0否 1是
     */
    private Integer isUrgent;

    /**
     * 签收验证码 (4位数字)
     */
    private String verifyCode;

    /**
     * 异常状态: 0正常 1异常
     */
    private Integer exceptionStatus;

    /**
     * 异常原因
     */
    private String exceptionReason;
}

