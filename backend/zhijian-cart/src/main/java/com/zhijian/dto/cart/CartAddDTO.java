package com.zhijian.dto.cart;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.io.Serializable;

/**
 * 添加购物车 DTO
 *
 * @author Liuhaonan
 * @since 1.0.0
 */
@Data
@Schema(description = "添加购物车请求参数")
public class CartAddDTO implements Serializable {

    @Schema(description = "药品ID")
    @NotNull(message = "药品ID不能为空")
    private Long medicineId;

    @Schema(description = "数量")
    @NotNull(message = "数量不能为空")
    @Min(value = 1, message = "数量必须大于0")
    private Integer count;
}

