package com.zhijian.dto.order;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 订单评价请求对象。
 */
@Data
@Schema(description = "订单评价DTO")
public class OrderCommentDTO {

    /**
     * 订单 ID。
     */
    @Schema(description = "订单ID")
    @NotNull(message = "订单ID不能为空")
    private Long orderId;

    /**
     * 评分。
     */
    @Schema(description = "评分 1-5")
    @NotNull(message = "评分不能为空")
    @Min(1)
    @Max(5)
    private Integer star;

    /**
     * 评价内容。
     */
    @Schema(description = "评价内容")
    @NotBlank(message = "评价内容不能为空")
    private String content;

    /**
     * 图片列表。
     */
    @Schema(description = "图片列表(逗号分隔)")
    private String images;
}
