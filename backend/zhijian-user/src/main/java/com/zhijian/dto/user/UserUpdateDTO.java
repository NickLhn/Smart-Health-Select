package com.zhijian.dto.user;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 用户信息更新 DTO
 * 
 * @author Liuhaonan
 * @since 1.0.0
 */
@Data
@Schema(description = "用户信息更新参数")
public class UserUpdateDTO {

    @Schema(description = "昵称")
    private String nickname;

    @Schema(description = "手机号")
    private String mobile;

    @Schema(description = "头像")
    private String avatar;
}

