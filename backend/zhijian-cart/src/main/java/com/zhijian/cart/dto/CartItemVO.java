package com.zhijian.cart.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;

/**
 * 购物车列表项视图对象。
 */
@Data
@Schema(description = "购物车列表项")
public class CartItemVO implements Serializable {

    /**
     * 购物车项 ID。
     */
    @Schema(description = "购物车项ID")
    private Long id;

    /**
     * 药品 ID。
     */
    @Schema(description = "药品ID")
    private Long medicineId;

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
     * 商品单价。
     */
    @Schema(description = "单价")
    private BigDecimal price;

    /**
     * 商品数量。
     */
    @Schema(description = "数量")
    private Integer count;

    /**
     * 商品库存。
     */
    @Schema(description = "库存")
    private Integer stock;
}
