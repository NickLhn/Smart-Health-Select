package com.zhijian.dto.order;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 订单信息 DTO
 * 
 * @author Liuhaonan
 * @since 1.0.0
 */
@Data
@Schema(description = "订单信息")
public class OrderDTO {

    @Schema(description = "订单ID")
    private Long id;

    @Schema(description = "药品名称")
    private String medicineName;

    @Schema(description = "药品图片")
    private String medicineImage;

    @Schema(description = "购买数量")
    private Integer quantity;

    @Schema(description = "单价")
    private BigDecimal price;

    @Schema(description = "总金额")
    private BigDecimal totalAmount;

    @Schema(description = "订单状态 (0:待支付 1:待发货 2:已发货 3:已完成 -1:已取消)")
    private Integer status;

    @Schema(description = "创建时间")
    private LocalDateTime createTime;
}

