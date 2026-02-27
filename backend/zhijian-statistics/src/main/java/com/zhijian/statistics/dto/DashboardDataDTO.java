package com.zhijian.statistics.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.List;

@Data
@Schema(description = "数据概览DTO")
public class DashboardDataDTO implements Serializable {
    @Schema(description = "总销售额")
    private BigDecimal totalSales;

    @Schema(description = "总订单数")
    private Long totalOrders;

    @Schema(description = "今日销售额")
    private BigDecimal todaySales;

    @Schema(description = "今日订单数")
    private Long todayOrders;

    @Schema(description = "近7天销售趋势")
    private List<DailySalesDTO> salesTrend;

    @Schema(description = "热销商品排行")
    private List<TopProductDTO> topProducts;
}
