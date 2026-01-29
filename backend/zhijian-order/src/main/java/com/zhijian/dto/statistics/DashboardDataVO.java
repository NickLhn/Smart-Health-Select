package com.zhijian.dto.statistics;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class DashboardDataVO {
    private Long totalOrders;
    private BigDecimal totalSales;
    private Long todayOrders;
    private BigDecimal todaySales;
    private Long totalUsers; // Only for admin
    private Long productCount; // Only for merchant (or both)
    
    // To-Do Counts
    private Long pendingPayment; // Status 0
    private Long pendingShipment; // Status 1
    private Long pendingAudit; // Status 7
    private Long pendingRefund; // Status 4

    private List<ChartDataVO> orderTrend;
    private List<ChartDataVO> salesTrend;
    private List<ChartDataVO> statusDistribution;
}

