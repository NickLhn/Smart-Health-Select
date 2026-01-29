package com.zhijian.pojo.marketing.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 优惠券实体类
 *
 * @author Liuhaonan
 * @since 1.0.0
 */
@Data
@TableName("sms_coupon")
public class Coupon implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 优惠券名称
     */
    private String name;

    /**
     * 优惠券类型 (0:全场通用 1:指定分类 2:指定商品)
     */
    private Integer type;

    /**
     * 使用门槛 (0:无门槛)
     */
    private BigDecimal minPoint;

    /**
     * 抵扣金额
     */
    private BigDecimal amount;

    /**
     * 每人限领张数
     */
    private Integer perLimit;

    /**
     * 使用数量
     */
    private Integer useCount;

    /**
     * 领取数量
     */
    private Integer receiveCount;

    /**
     * 发行数量
     */
    private Integer totalCount;

    /**
     * 状态 (1:生效 0:失效)
     */
    private Integer status;

    /**
     * 生效时间
     */
    private LocalDateTime startTime;

    /**
     * 失效时间
     */
    private LocalDateTime endTime;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}

