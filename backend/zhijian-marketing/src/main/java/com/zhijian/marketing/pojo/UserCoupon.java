package com.zhijian.marketing.pojo;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 用户优惠券实体类。
 */
@Data
@TableName("sms_coupon_history")
public class UserCoupon implements Serializable {

    /**
     * 序列化版本号。
     */
    private static final long serialVersionUID = 1L;

    /**
     * 记录 ID。
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 优惠券 ID。
     */
    private Long couponId;

    /**
     * 用户 ID。
     */
    private Long userId;

    /**
     * 订单 ID。
     */
    private Long orderId;

    /**
     * 券码。
     */
    private String couponCode;

    /**
     * 用户昵称。
     */
    private String memberNickname;

    /**
     * 领取方式。
     */
    private Integer getType;

    /**
     * 使用状态。
     */
    private Integer useStatus;

    /**
     * 使用时间。
     */
    private LocalDateTime useTime;

    /**
     * 创建时间。
     */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
