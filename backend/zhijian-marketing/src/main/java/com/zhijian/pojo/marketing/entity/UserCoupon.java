package com.zhijian.pojo.marketing.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 用户优惠券实体类
 *
 * @author Liuhaonan
 * @since 1.0.0
 */
@Data
@TableName("sms_coupon_history")
public class UserCoupon implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 优惠券ID
     */
    private Long couponId;

    /**
     * 用户ID
     */
    private Long userId;

    /**
     * 订单ID
     */
    private Long orderId;

    /**
     * 优惠券码
     */
    private String couponCode;

    /**
     * 领取人昵称
     */
    private String memberNickname;

    /**
     * 获取类型 (0:后台赠送 1:主动领取)
     */
    private Integer getType;

    /**
     * 使用状态 (0:未使用 1:已使用 2:已过期)
     */
    private Integer useStatus;

    /**
     * 使用时间
     */
    private LocalDateTime useTime;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}

