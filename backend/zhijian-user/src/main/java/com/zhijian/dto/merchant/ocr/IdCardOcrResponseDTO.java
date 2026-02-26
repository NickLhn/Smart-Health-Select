package com.zhijian.dto.merchant.ocr;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
public class IdCardOcrResponseDTO {
    @Schema(description = "姓名")
    private OcrFieldDTO name;

    @Schema(description = "身份证号(候选)")
    private OcrFieldDTO idNumber;

    @Schema(description = "住址(候选)")
    private OcrFieldDTO address;

    @Schema(description = "签发机关(候选)")
    private OcrFieldDTO authority;

    @Schema(description = "有效期(候选)")
    private OcrFieldDTO validDate;
}

