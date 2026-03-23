package com.zhijian.marketing.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 用户优惠券视图对象。
 */
@Data
@Schema(description = "用户优惠券信息")
public class UserCouponDTO {

    /**
     * 记录 ID。
     */
    @Schema(description = "记录ID")
    private Long id;

    /**
     * 优惠券 ID。
     */
    @Schema(description = "优惠券ID")
    private Long couponId;

    /**
     * 优惠券名称。
     */
    @Schema(description = "优惠券名称")
    private String name;

    /**
     * 抵扣金额。
     */
    @Schema(description = "抵扣金额")
    private BigDecimal amount;

    /**
     * 使用门槛金额。
     */
    @Schema(description = "使用门槛")
    private BigDecimal minPoint;

    /**
     * 生效时间。
     */
    @Schema(description = "开始时间")
    private LocalDateTime startTime;

    /**
     * 失效时间。
     */
    @Schema(description = "结束时间")
    private LocalDateTime endTime;

    /**
     * 使用状态。
     */
    @Schema(description = "使用状态 (0:未使用 1:已使用 2:已过期)")
    private Integer useStatus;
}
