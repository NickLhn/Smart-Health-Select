package com.zhijian.interfaces.dto.cart;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;

/**
 * 购物车列表项 VO
 *
 * @author Liuhaonan
 * @since 1.0.0
 */
@Data
@Schema(description = "购物车列表项")
public class CartItemVO implements Serializable {

    @Schema(description = "购物车项ID")
    private Long id;

    @Schema(description = "药品ID")
    private Long medicineId;

    @Schema(description = "药品名称")
    private String medicineName;

    @Schema(description = "药品图片")
    private String medicineImage;

    @Schema(description = "单价")
    private BigDecimal price;

    @Schema(description = "数量")
    private Integer count;
    
    @Schema(description = "库存")
    private Integer stock;
}
