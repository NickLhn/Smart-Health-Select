package com.zhijian.interfaces.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 优惠券创建 DTO
 *
 * @author Liuhaonan
 * @since 1.0.0
 */
@Data
@Schema(description = "优惠券创建参数")
public class CouponCreateDTO {

    @Schema(description = "优惠券名称")
    private String name;

    @Schema(description = "优惠券类型 (0:全场通用 1:指定分类 2:指定商品)")
    private Integer type;

    @Schema(description = "使用门槛 (0:无门槛)")
    private BigDecimal minPoint;

    @Schema(description = "抵扣金额")
    private BigDecimal amount;

    @Schema(description = "每人限领张数")
    private Integer perLimit;

    @Schema(description = "发行数量")
    private Integer totalCount;

    @Schema(description = "生效时间")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime startTime;

    @Schema(description = "失效时间")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime endTime;
}
