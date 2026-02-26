package com.zhijian.dto.merchant.ocr;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDate;

@Data
public class IdCardOcrResponseDTO {
    @Schema(description = "姓名")
    private OcrFieldDTO name;

    @Schema(description = "身份证号(候选)")
    private OcrFieldDTO idNumber;

    @Schema(description = "身份证号后4位(用于入库)")
    private String idNumberLast4;

    @Schema(description = "身份证号哈希(用于入库)")
    private String idNumberHash;

    @Schema(description = "住址(候选)")
    private OcrFieldDTO address;

    @Schema(description = "签发机关(候选)")
    private OcrFieldDTO authority;

    @Schema(description = "有效期(候选)")
    private OcrFieldDTO validDate;

    @Schema(description = "有效期开始(用于入库)")
    private LocalDate validFrom;

    @Schema(description = "有效期结束(用于入库)")
    private LocalDate validTo;

    @Schema(description = "长期有效(用于入库)")
    private Boolean validLongTerm;
}
