package com.zhijian.marketing.pojo;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 优惠券实体类。
 */
@Data
@TableName("sms_coupon")
public class Coupon implements Serializable {

    /**
     * 序列化版本号。
     */
    private static final long serialVersionUID = 1L;

    /**
     * 优惠券 ID。
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 优惠券名称。
     */
    private String name;

    /**
     * 优惠券类型。
     */
    private Integer type;

    /**
     * 使用门槛金额。
     */
    private BigDecimal minPoint;

    /**
     * 抵扣金额。
     */
    private BigDecimal amount;

    /**
     * 每人限领张数。
     */
    private Integer perLimit;

    /**
     * 使用次数。
     */
    private Integer useCount;

    /**
     * 已领取次数。
     */
    private Integer receiveCount;

    /**
     * 总发放数量。
     */
    private Integer totalCount;

    /**
     * 优惠券状态。
     */
    private Integer status;

    /**
     * 生效时间。
     */
    private LocalDateTime startTime;

    /**
     * 失效时间。
     */
    private LocalDateTime endTime;

    /**
     * 创建时间。
     */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
