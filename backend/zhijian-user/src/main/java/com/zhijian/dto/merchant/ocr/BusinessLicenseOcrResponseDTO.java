package com.zhijian.dto.merchant.ocr;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 营业执照 OCR 响应对象。
 */
@Data
public class BusinessLicenseOcrResponseDTO {
    @Schema(description = "统一社会信用代码")
    private OcrFieldDTO creditCode;

    @Schema(description = "营业/登记地址(候选)")
    private OcrFieldDTO address;

    @Schema(description = "主体名称(候选)")
    private OcrFieldDTO entityName;
}
