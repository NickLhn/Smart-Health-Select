package com.zhijian.statistics.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "每日销售数据")
public class DailySalesDTO implements Serializable {
    @Schema(description = "日期 (yyyy-MM-dd)")
    private String date;

    @Schema(description = "销售额")
    private BigDecimal amount;

    @Schema(description = "订单数")
    private Long orderCount;
}
