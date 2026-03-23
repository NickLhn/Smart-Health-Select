package com.zhijian.dto.order;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 订单审核请求对象。
 */
@Data
@Schema(description = "订单审核参数")
public class OrderAuditDTO {

    /**
     * 订单 ID。
     */
    @Schema(description = "订单ID", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "订单ID不能为空")
    private Long orderId;

    /**
     * 是否通过。
     */
    @Schema(description = "是否通过", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "审核结果不能为空")
    private Boolean pass;

    /**
     * 审核意见。
     */
    @Schema(description = "审核意见")
    private String reason;
}
