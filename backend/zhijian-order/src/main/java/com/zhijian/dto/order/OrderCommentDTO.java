package com.zhijian.dto.order;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
@Schema(description = "订单评价DTO")
public class OrderCommentDTO {

    @Schema(description = "订单ID")
    @NotNull(message = "订单ID不能为空")
    private Long orderId;
    
    // 目前简化逻辑：订单只包含一个商品（或只评价主商品）
    // 如果是购物车合并下单拆单的，每个Order对应一个商品，可以直接取 medicineId
    // 如果Order包含多个Item，应该针对Item评价。
    // 根据 OrderServiceImpl，createOrderFromCart 也是按商品拆单的 (每个 Order 只有一个 item)。
    // createOrder 也是单商品。
    // 所以 Order 和 Medicine 是一对一关系。
    
    @Schema(description = "评分 1-5")
    @NotNull(message = "评分不能为空")
    @Min(1)
    @Max(5)
    private Integer star;

    @Schema(description = "评价内容")
    @NotBlank(message = "评价内容不能为空")
    private String content;

    @Schema(description = "图片列表(逗号分隔)")
    private String images;
}

