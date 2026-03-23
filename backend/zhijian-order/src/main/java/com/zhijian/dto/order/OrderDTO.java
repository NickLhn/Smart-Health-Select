package com.zhijian.dto.order;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 订单视图对象。
 */
@Data
@Schema(description = "订单信息")
public class OrderDTO {

    /**
     * 订单 ID。
     */
    @Schema(description = "订单ID")
    private Long id;

    /**
     * 药品名称。
     */
    @Schema(description = "药品名称")
    private String medicineName;

    /**
     * 药品图片。
     */
    @Schema(description = "药品图片")
    private String medicineImage;

    /**
     * 购买数量。
     */
    @Schema(description = "购买数量")
    private Integer quantity;

    /**
     * 单价。
     */
    @Schema(description = "单价")
    private BigDecimal price;

    /**
     * 总金额。
     */
    @Schema(description = "总金额")
    private BigDecimal totalAmount;

    /**
     * 订单状态。
     */
    @Schema(description = "订单状态 (0:待支付 1:待发货 2:已发货 3:已完成 -1:已取消)")
    private Integer status;

    /**
     * 创建时间。
     */
    @Schema(description = "创建时间")
    private LocalDateTime createTime;
}
