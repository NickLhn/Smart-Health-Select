package com.zhijian.dto.medicine;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 轮播图 DTO
 * 
 * @author Liuhaonan
 * @since 1.0.0
 */
@Data
@Schema(description = "轮播图 DTO")
public class BannerDTO {

    @Schema(description = "标题")
    @NotBlank(message = "标题不能为空")
    private String title;

    @Schema(description = "图片地址")
    @NotBlank(message = "图片地址不能为空")
    private String imageUrl;

    @Schema(description = "跳转链接")
    private String linkUrl;

    @Schema(description = "排序")
    private Integer sort;

    @Schema(description = "状态: 1启用 0禁用")
    private Integer status;
}

