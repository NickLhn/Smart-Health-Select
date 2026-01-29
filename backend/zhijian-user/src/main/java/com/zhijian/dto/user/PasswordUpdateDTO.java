package com.zhijian.dto.user;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 修改密码 DTO
 * 
 * @author Liuhaonan
 * @since 1.0.0
 */
@Data
@Schema(description = "修改密码参数")
public class PasswordUpdateDTO {

    @Schema(description = "旧密码")
    @NotBlank(message = "旧密码不能为空")
    private String oldPassword;

    @Schema(description = "新密码")
    @NotBlank(message = "新密码不能为空")
    private String newPassword;
}

