package com.zhijian.dto.merchant.ocr;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class IdCardBundleOcrRequestDTO {
    @Schema(description = "身份证正面图片URL", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "frontImageUrl不能为空")
    private String frontImageUrl;

    @Schema(description = "身份证反面图片URL", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "backImageUrl不能为空")
    private String backImageUrl;
}

