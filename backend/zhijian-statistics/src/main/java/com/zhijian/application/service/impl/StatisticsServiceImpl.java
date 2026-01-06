package com.zhijian.application.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.zhijian.application.service.OrderService;
import com.zhijian.domain.order.entity.Order;
import com.zhijian.interfaces.dto.order.ProductSalesDTO;
import com.zhijian.interfaces.dto.statistics.DailySalesDTO;
import com.zhijian.interfaces.dto.statistics.DashboardDataDTO;
import com.zhijian.interfaces.dto.statistics.TopProductDTO;
import com.zhijian.application.service.StatisticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StatisticsServiceImpl implements StatisticsService {

    private final OrderService orderService;

    @Override
    public DashboardDataDTO getAdminDashboardData() {
        DashboardDataDTO data = new DashboardDataDTO();

        // 1. 统计总销售额和订单数 (仅统计已完成的订单，或者已支付的订单)
        // 这里简化逻辑，统计已支付(1)、已发货(2)、已完成(3)
        List<Integer> validStatus = List.of(1, 2, 3, 5); // 5是已退款，销售额通常要扣除，这里简单处理先算流水

        // 总览
        List<Order> allOrders = orderService.list(new LambdaQueryWrapper<Order>()
                .in(Order::getStatus, validStatus));
        
        BigDecimal totalSales = allOrders.stream()
                .map(Order::getPayAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        data.setTotalSales(totalSales);
        data.setTotalOrders((long) allOrders.size());

        // 2. 今日数据
        LocalDateTime startOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        LocalDateTime endOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MAX);
        
        List<Order> todayOrders = orderService.list(new LambdaQueryWrapper<Order>()
                .in(Order::getStatus, validStatus)
                .ge(Order::getCreateTime, startOfDay)
                .le(Order::getCreateTime, endOfDay));

        BigDecimal todaySales = todayOrders.stream()
                .map(Order::getPayAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        data.setTodaySales(todaySales);
        data.setTodayOrders((long) todayOrders.size());

        // 3. 近7天趋势
        List<DailySalesDTO> trend = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate date = LocalDate.now().minusDays(i);
            LocalDateTime start = LocalDateTime.of(date, LocalTime.MIN);
            LocalDateTime end = LocalDateTime.of(date, LocalTime.MAX);
            
            List<Order> dayOrders = orderService.list(new LambdaQueryWrapper<Order>()
                    .in(Order::getStatus, validStatus)
                    .ge(Order::getCreateTime, start)
                    .le(Order::getCreateTime, end));
            
            BigDecimal dayAmount = dayOrders.stream()
                    .map(Order::getPayAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            trend.add(new DailySalesDTO(date.format(DateTimeFormatter.ofPattern("yyyy-MM-dd")), dayAmount, (long) dayOrders.size()));
        }
        data.setSalesTrend(trend);

        // 4. 热销商品 (从订单项聚合)
        List<ProductSalesDTO> topSelling = orderService.getTopSellingProducts(10);
        List<TopProductDTO> topProducts = topSelling.stream().map(dto -> {
            TopProductDTO p = new TopProductDTO();
            p.setMedicineId(dto.getMedicineId());
            p.setMedicineName(dto.getMedicineName());
            p.setSalesCount(dto.getSalesCount());
            return p;
        }).collect(Collectors.toList());
        
        data.setTopProducts(topProducts);

        return data;
    }
}
