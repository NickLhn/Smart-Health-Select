package com.zhijian.marketing.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 优惠券创建请求对象。
 */
@Data
@Schema(description = "优惠券创建参数")
public class CouponCreateDTO {

    /**
     * 优惠券名称。
     */
    @Schema(description = "优惠券名称")
    private String name;

    /**
     * 优惠券类型。
     */
    @Schema(description = "优惠券类型 (0:全场通用 1:指定分类 2:指定商品)")
    private Integer type;

    /**
     * 使用门槛金额。
     */
    @Schema(description = "使用门槛 (0:无门槛)")
    private BigDecimal minPoint;

    /**
     * 抵扣金额。
     */
    @Schema(description = "抵扣金额")
    private BigDecimal amount;

    /**
     * 每人限领张数。
     */
    @Schema(description = "每人限领张数")
    private Integer perLimit;

    /**
     * 发行数量。
     */
    @Schema(description = "发行数量")
    private Integer totalCount;

    /**
     * 生效时间。
     */
    @Schema(description = "生效时间")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime startTime;

    /**
     * 失效时间。
     */
    @Schema(description = "失效时间")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime endTime;
}
