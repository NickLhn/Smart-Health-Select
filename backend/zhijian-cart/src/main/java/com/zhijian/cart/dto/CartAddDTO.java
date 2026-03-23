package com.zhijian.cart.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.io.Serializable;

/**
 * 添加购物车请求对象。
 */
@Data
@Schema(description = "添加购物车请求参数")
public class CartAddDTO implements Serializable {

    /**
     * 药品 ID。
     */
    @Schema(description = "药品ID")
    @NotNull(message = "药品ID不能为空")
    private Long medicineId;

    /**
     * 加购数量。
     */
    @Schema(description = "数量")
    @NotNull(message = "数量不能为空")
    @Min(value = 1, message = "数量必须大于0")
    private Integer count;
}
