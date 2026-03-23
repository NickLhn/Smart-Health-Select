package com.zhijian.aftersales.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.io.Serializable;

/**
 * 退款审核数据传输对象。
 */
@Data
@Schema(description = "退款审核DTO")
public class RefundAuditDTO implements Serializable {

    /**
     * 退款申请 ID。
     */
    @Schema(description = "退款申请ID")
    @NotNull(message = "退款申请ID不能为空")
    private Long id;

    /**
     * 审核是否通过。
     */
    @Schema(description = "是否通过")
    @NotNull(message = "审核结果不能为空")
    private Boolean pass;

    /**
     * 审核备注。
     */
    @Schema(description = "审核备注")
    private String auditReason;
}
