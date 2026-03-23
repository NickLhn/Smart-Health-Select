package com.zhijian.dto.merchant.ocr;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * OCR 字段结果对象。
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OcrFieldDTO {
    @Schema(description = "识别值")
    private String value;

    @Schema(description = "置信度(0-100)")
    private Integer confidence;
}
