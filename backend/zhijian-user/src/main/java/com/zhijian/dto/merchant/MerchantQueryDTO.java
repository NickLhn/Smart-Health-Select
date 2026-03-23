package com.zhijian.dto.merchant;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 商家查询参数
 */
@Data
@Schema(description = "商家查询参数")
public class MerchantQueryDTO {

    @Schema(description = "页码", defaultValue = "1")
    private Integer page = 1;

    @Schema(description = "每页大小", defaultValue = "10")
    private Integer size = 10;

    @Schema(description = "关键词(店铺名)")
    private String keyword;

    @Schema(description = "审核状态: 0待审核 1审核通过 2审核驳回")
    private Integer auditStatus;
}

