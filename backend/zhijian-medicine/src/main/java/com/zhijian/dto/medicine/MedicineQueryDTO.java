package com.zhijian.dto.medicine;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 药品查询请求对象。
 */
@Data
@Schema(description = "药品查询参数")
public class MedicineQueryDTO {

    /**
     * 关键字。
     */
    @Schema(description = "药品名称(模糊查询)")
    private String keyword;

    /**
     * 分类 ID。
     */
    @Schema(description = "分类ID")
    private Long categoryId;

    /**
     * 是否处方药。
     */
    @Schema(description = "是否处方药")
    private Integer isPrescription;

    /**
     * 排序字段。
     */
    @Schema(description = "排序字段: price(价格), sales(销量)")
    private String sortBy;

    /**
     * 排序方式。
     */
    @Schema(description = "排序方式: asc(升序), desc(降序)")
    private String sortOrder;

    /**
     * 前端排序参数。
     */
    @Schema(description = "前端传入的排序参数 (e.g. price_asc, sales_desc)")
    private String sort;

    /**
     * 上下架状态。
     */
    @Schema(description = "状态: 1上架 0下架 (仅管理员可用)")
    private Integer status;

    /**
     * 商家 ID。
     */
    @Schema(description = "商家ID")
    private Long sellerId;

    /**
     * 页码。
     */
    @Schema(description = "页码", defaultValue = "1")
    private Integer page = 1;

    /**
     * 每页大小。
     */
    @Schema(description = "每页大小", defaultValue = "10")
    private Integer size = 10;
}
