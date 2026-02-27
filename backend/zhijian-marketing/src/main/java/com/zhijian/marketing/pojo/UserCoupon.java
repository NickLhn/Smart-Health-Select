package com.zhijian.marketing.pojo;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@TableName("sms_coupon_history")
public class UserCoupon implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long couponId;

    private Long userId;

    private Long orderId;

    private String couponCode;

    private String memberNickname;

    private Integer getType;

    private Integer useStatus;

    private LocalDateTime useTime;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
