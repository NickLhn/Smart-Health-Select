package com.zhijian.aftersales.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.io.Serializable;

/**
 * 退款申请数据传输对象。
 */
@Data
@Schema(description = "退款申请DTO")
public class RefundApplyDTO implements Serializable {

    /**
     * 订单 ID。
     */
    @Schema(description = "订单ID")
    @NotNull(message = "订单ID不能为空")
    private Long orderId;

    /**
     * 退款类型。
     */
    @Schema(description = "类型: 1仅退款 2退货退款")
    @NotNull(message = "类型不能为空")
    private Integer type;

    /**
     * 退款原因。
     */
    @Schema(description = "退款原因")
    @NotNull(message = "退款原因不能为空")
    private String reason;

    /**
     * 凭证图片。
     */
    @Schema(description = "凭证图片(JSON数组)")
    private String images;
}
