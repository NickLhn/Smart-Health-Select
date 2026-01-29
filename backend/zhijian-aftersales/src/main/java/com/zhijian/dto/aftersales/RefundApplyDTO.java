package com.zhijian.dto.aftersales;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import jakarta.validation.constraints.NotNull;
import java.io.Serializable;

@Data
@Schema(description = "退款申请DTO")
public class RefundApplyDTO implements Serializable {
    @Schema(description = "订单ID")
    @NotNull(message = "订单ID不能为空")
    private Long orderId;

    @Schema(description = "类型: 1仅退款 2退货退款")
    @NotNull(message = "类型不能为空")
    private Integer type;

    @Schema(description = "退款原因")
    @NotNull(message = "退款原因不能为空")
    private String reason;

    @Schema(description = "凭证图片(JSON数组)")
    private String images;
}