package com.zhijian.dto.medicine;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 轮播图请求对象。
 */
@Data
@Schema(description = "轮播图 DTO")
public class BannerDTO {

    /**
     * 标题。
     */
    @Schema(description = "标题")
    @NotBlank(message = "标题不能为空")
    private String title;

    /**
     * 图片地址。
     */
    @Schema(description = "图片地址")
    @NotBlank(message = "图片地址不能为空")
    private String imageUrl;

    /**
     * 跳转链接。
     */
    @Schema(description = "跳转链接")
    private String linkUrl;

    /**
     * 排序值。
     */
    @Schema(description = "排序")
    private Integer sort;

    /**
     * 启用状态。
     */
    @Schema(description = "状态: 1启用 0禁用")
    private Integer status;
}
