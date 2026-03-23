package com.zhijian.dto.statistics;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/**
 * 仪表盘数据视图对象。
 */
@Data
public class DashboardDataVO {

    /**
     * 订单总数。
     */
    private Long totalOrders;

    /**
     * 销售总额。
     */
    private BigDecimal totalSales;

    /**
     * 今日订单数。
     */
    private Long todayOrders;

    /**
     * 今日销售额。
     */
    private BigDecimal todaySales;

    /**
     * 用户总数。
     */
    private Long totalUsers;

    /**
     * 商品总数。
     */
    private Long productCount;

    /**
     * 待支付数量。
     */
    private Long pendingPayment;

    /**
     * 待发货数量。
     */
    private Long pendingShipment;

    /**
     * 待审核数量。
     */
    private Long pendingAudit;

    /**
     * 待退款数量。
     */
    private Long pendingRefund;

    /**
     * 订单趋势。
     */
    private List<ChartDataVO> orderTrend;

    /**
     * 销售趋势。
     */
    private List<ChartDataVO> salesTrend;

    /**
     * 状态分布。
     */
    private List<ChartDataVO> statusDistribution;
}
