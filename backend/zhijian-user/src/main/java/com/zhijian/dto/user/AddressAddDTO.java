package com.zhijian.dto.user;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 添加地址DTO
 */
@Data
@Schema(description = "添加地址请求参数")
public class AddressAddDTO {

    @Schema(description = "收货人姓名")
    @NotBlank(message = "收货人姓名不能为空")
    private String receiverName;

    @Schema(description = "收货人手机号")
    @NotBlank(message = "收货人手机号不能为空")
    private String receiverPhone;

    @Schema(description = "省份")
    @NotBlank(message = "省份不能为空")
    private String province;

    @Schema(description = "城市")
    @NotBlank(message = "城市不能为空")
    private String city;

    @Schema(description = "区/县")
    @NotBlank(message = "区/县不能为空")
    private String region;

    @Schema(description = "详细地址")
    @NotBlank(message = "详细地址不能为空")
    private String detailAddress;

    @Schema(description = "是否默认: 1是 0否")
    private Integer isDefault;
}

