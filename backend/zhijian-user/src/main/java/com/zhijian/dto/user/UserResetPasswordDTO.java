package com.zhijian.dto.user;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 用户重置密码 DTO
 */
@Data
@Schema(description = "用户重置密码请求参数")
public class UserResetPasswordDTO {

    @Schema(description = "手机号", requiredMode = Schema.RequiredMode.REQUIRED, example = "13800138000")
    @NotBlank(message = "手机号不能为空")
    private String mobile;

    @Schema(description = "验证码", requiredMode = Schema.RequiredMode.REQUIRED, example = "123456")
    @NotBlank(message = "验证码不能为空")
    private String captcha;

    @Schema(description = "新密码", requiredMode = Schema.RequiredMode.REQUIRED, example = "123456")
    @NotBlank(message = "新密码不能为空")
    private String newPassword;

    @Schema(description = "角色", requiredMode = Schema.RequiredMode.NOT_REQUIRED, example = "USER")
    private String role;
}

