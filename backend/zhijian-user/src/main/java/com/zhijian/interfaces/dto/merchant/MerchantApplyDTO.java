package com.zhijian.interfaces.dto.merchant;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 商家入驻申请 DTO
 *
 * @author TraeAI
 * @since 1.0.0
 */
@Data
@Schema(description = "商家入驻申请参数")
public class MerchantApplyDTO {

    @Schema(description = "店铺名称", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "店铺名称不能为空")
    private String shopName;

    @Schema(description = "店铺Logo")
    private String shopLogo;

    @Schema(description = "店铺简介")
    private String description;

    @Schema(description = "店铺地址")
    @NotBlank(message = "店铺地址不能为空")
    private String address;

    @Schema(description = "营业执照图片")
    @NotBlank(message = "营业执照不能为空")
    private String licenseUrl;

    @Schema(description = "法人身份证正面")
    private String idCardFront;

    @Schema(description = "法人身份证背面")
    private String idCardBack;

    @Schema(description = "联系人姓名")
    private String contactName;

    @Schema(description = "联系电话")
    private String contactPhone;

    @Schema(description = "统一社会信用代码")
    private String creditCode;
}
