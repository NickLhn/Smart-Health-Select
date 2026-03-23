package com.zhijian.cart.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.io.Serializable;

/**
 * 更新购物车请求对象。
 */
@Data
@Schema(description = "更新购物车请求参数")
public class CartUpdateDTO implements Serializable {

    /**
     * 购物车项 ID。
     */
    @Schema(description = "购物车项ID")
    @NotNull(message = "购物车项ID不能为空")
    private Long id;

    /**
     * 商品数量。
     */
    @Schema(description = "数量")
    @NotNull(message = "数量不能为空")
    @Min(value = 1, message = "数量必须大于0")
    private Integer count;
}
