package com.zhijian.dto.merchant;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;

/**
 * 商家入驻申请 DTO
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

    @Schema(description = "法人身份证号后4位")
    private String legalPersonIdLast4;

    @Schema(description = "法人身份证号哈希")
    private String legalPersonIdHash;

    @Schema(description = "法人证件住址")
    private String legalPersonAddress;

    @Schema(description = "身份证签发机关")
    private String idCardAuthority;

    @Schema(description = "身份证有效期开始")
    private LocalDate idCardValidFrom;

    @Schema(description = "身份证有效期结束")
    private LocalDate idCardValidTo;

    @Schema(description = "身份证长期有效: 1是 0否")
    private Integer idCardValidLongTerm;
}

