package com.zhijian.statistics.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;

/**
 * 热销商品对象。
 */
@Data
@Schema(description = "热销商品")
public class TopProductDTO implements Serializable {
    @Schema(description = "商品ID")
    private Long medicineId;

    @Schema(description = "商品名称")
    private String medicineName;

    @Schema(description = "销量")
    private Integer salesCount;
}
