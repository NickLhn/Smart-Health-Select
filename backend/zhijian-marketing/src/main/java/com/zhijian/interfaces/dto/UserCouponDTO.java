package com.zhijian.interfaces.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 用户优惠券 DTO
 *
 * @author Liuhaonan
 * @since 1.0.0
 */
@Data
@Schema(description = "用户优惠券信息")
public class UserCouponDTO {

    @Schema(description = "记录ID")
    private Long id;

    @Schema(description = "优惠券ID")
    private Long couponId;

    @Schema(description = "优惠券名称")
    private String name;

    @Schema(description = "抵扣金额")
    private BigDecimal amount;

    @Schema(description = "使用门槛")
    private BigDecimal minPoint;

    @Schema(description = "开始时间")
    private LocalDateTime startTime;

    @Schema(description = "结束时间")
    private LocalDateTime endTime;

    @Schema(description = "使用状态 (0:未使用 1:已使用 2:已过期)")
    private Integer useStatus;
}
