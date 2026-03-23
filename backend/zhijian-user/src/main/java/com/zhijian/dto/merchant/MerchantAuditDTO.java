package com.zhijian.dto.merchant;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 商家审核 DTO
 */
@Data
@Schema(description = "商家审核参数")
public class MerchantAuditDTO {

    @Schema(description = "商家ID", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "商家ID不能为空")
    private Long id;

    @Schema(description = "审核状态: 1通过 2驳回", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "审核状态不能为空")
    private Integer auditStatus;

    @Schema(description = "审核备注")
    private String auditRemark;
}

