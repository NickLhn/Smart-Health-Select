package com.zhijian.dto.medicine;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 药品查询参数 DTO
 * 
 * @author Liuhaonan
 * @since 1.0.0
 */
@Data
@Schema(description = "药品查询参数")
public class MedicineQueryDTO {

    @Schema(description = "药品名称(模糊查询)")
    private String keyword;

    @Schema(description = "分类ID")
    private Long categoryId;

    @Schema(description = "是否处方药")
    private Integer isPrescription;

    @Schema(description = "排序字段: price(价格), sales(销量)")
    private String sortBy;

    @Schema(description = "排序方式: asc(升序), desc(降序)")
    private String sortOrder;

    @Schema(description = "前端传入的排序参数 (e.g. price_asc, sales_desc)")
    private String sort;

    @Schema(description = "状态: 1上架 0下架 (仅管理员可用)")
    private Integer status;

    @Schema(description = "商家ID")
    private Long sellerId;

    @Schema(description = "页码", defaultValue = "1")
    private Integer page = 1;

    @Schema(description = "每页大小", defaultValue = "10")
    private Integer size = 10;
}

