package com.zhijian.dto.merchant.ocr;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 营业执照 OCR 请求对象。
 */
@Data
public class BusinessLicenseOcrRequestDTO {
    @Schema(description = "营业执照图片URL", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "imageUrl不能为空")
    private String imageUrl;
}
