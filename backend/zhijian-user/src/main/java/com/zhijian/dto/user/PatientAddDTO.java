package com.zhijian.dto.user;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDate;

/**
 * 添加就诊人DTO
 */
@Data
@Schema(description = "添加就诊人请求参数")
public class PatientAddDTO {

    @Schema(description = "姓名")
    private String name;

    @Schema(description = "身份证号")
    private String idCard;

    @Schema(description = "身份证正面URL")
    private String idCardFront;

    @Schema(description = "身份证背面URL")
    private String idCardBack;

    @Schema(description = "手机号")
    private String phone;

    @Schema(description = "性别(0-未知 1-男 2-女)")
    private Integer gender;

    @Schema(description = "出生日期")
    private LocalDate birthday;

    @Schema(description = "是否默认(0-否 1-是)")
    private Integer isDefault;
}

