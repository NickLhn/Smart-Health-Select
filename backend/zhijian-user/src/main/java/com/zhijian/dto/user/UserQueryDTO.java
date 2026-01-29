package com.zhijian.dto.user;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "用户查询参数")
public class UserQueryDTO {

    @Schema(description = "页码", defaultValue = "1")
    private Integer page = 1;

    @Schema(description = "每页大小", defaultValue = "10")
    private Integer size = 10;

    @Schema(description = "关键词(用户名/昵称/手机号)")
    private String keyword;

    @Schema(description = "角色")
    private String role;

    @Schema(description = "状态(0:禁用 1:正常)")
    private Integer status;
}

