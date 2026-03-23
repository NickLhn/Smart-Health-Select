package com.zhijian.dto.user;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 用户登录 DTO
 */
@Data
@Schema(description = "用户登录请求参数")
public class UserLoginDTO {

    @Schema(description = "用户名", requiredMode = Schema.RequiredMode.NOT_REQUIRED, example = "admin")
    private String username;

    @Schema(description = "密码", requiredMode = Schema.RequiredMode.NOT_REQUIRED, example = "123456")
    private String password;

    @Schema(description = "手机号", requiredMode = Schema.RequiredMode.NOT_REQUIRED, example = "13800138000")
    private String mobile;

    @Schema(description = "验证码", requiredMode = Schema.RequiredMode.NOT_REQUIRED, example = "123456")
    private String captcha;

    @Schema(description = "角色", requiredMode = Schema.RequiredMode.NOT_REQUIRED, example = "USER")
    private String role;
}

