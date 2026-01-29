package com.zhijian.dto.user;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 更新地址DTO
 * 
 * @author Liuhaonan
 * @since 1.0.0
 */
@Data
@EqualsAndHashCode(callSuper = true)
@Schema(description = "更新地址请求参数")
public class AddressUpdateDTO extends AddressAddDTO {

    @Schema(description = "地址ID")
    @NotNull(message = "地址ID不能为空")
    private Long id;
}

