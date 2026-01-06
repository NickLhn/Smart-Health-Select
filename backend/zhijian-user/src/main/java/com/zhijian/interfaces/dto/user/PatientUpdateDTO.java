package com.zhijian.interfaces.dto.user;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDate;

/**
 * 修改就诊人DTO
 *
 * @author Liuhaonan
 * @since 1.0.0
 */
@Data
@Schema(description = "修改就诊人请求参数")
public class PatientUpdateDTO {

    @Schema(description = "就诊人ID")
    private Long id;

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
