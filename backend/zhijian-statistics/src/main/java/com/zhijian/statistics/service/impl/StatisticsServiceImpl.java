package com.zhijian.statistics.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.zhijian.dto.order.ProductSalesDTO;
import com.zhijian.pojo.Order;
import com.zhijian.service.OrderService;
import com.zhijian.statistics.dto.DailySalesDTO;
import com.zhijian.statistics.dto.DashboardDataDTO;
import com.zhijian.statistics.dto.TopProductDTO;
import com.zhijian.statistics.service.StatisticsService;
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

        List<Integer> validStatus = List.of(1, 2, 3, 5);

        List<Order> allOrders = orderService.list(new LambdaQueryWrapper<Order>()
                .in(Order::getStatus, validStatus));

        BigDecimal totalSales = allOrders.stream()
                .map(Order::getPayAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        data.setTotalSales(totalSales);
        data.setTotalOrders((long) allOrders.size());

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

        List<DailySalesDTO> trend = new ArrayList<>();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
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

            trend.add(new DailySalesDTO(date.format(fmt), dayAmount, (long) dayOrders.size()));
        }
        data.setSalesTrend(trend);

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
