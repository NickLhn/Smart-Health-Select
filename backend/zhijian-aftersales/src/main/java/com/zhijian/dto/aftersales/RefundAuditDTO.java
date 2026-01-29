package com.zhijian.dto.aftersales;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import jakarta.validation.constraints.NotNull;
import java.io.Serializable;

@Data
@Schema(description = "退款审核DTO")
public class RefundAuditDTO implements Serializable {
    @Schema(description = "退款申请ID")
    @NotNull(message = "退款申请ID不能为空")
    private Long id;

    @Schema(description = "是否通过")
    @NotNull(message = "审核结果不能为空")
    private Boolean pass;

    @Schema(description = "审核备注")
    private String auditReason;
}