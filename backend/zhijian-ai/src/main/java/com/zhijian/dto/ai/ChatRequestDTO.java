package com.zhijian.dto.ai;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import jakarta.validation.constraints.NotBlank;
import java.io.Serializable;

@Data
@Schema(description = "AI聊天请求")
public class ChatRequestDTO implements Serializable {
    @Schema(description = "用户输入")
    @NotBlank(message = "输入不能为空")
    private String message;
}

