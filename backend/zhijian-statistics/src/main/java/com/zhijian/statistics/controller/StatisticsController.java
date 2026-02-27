package com.zhijian.statistics.controller;

import com.zhijian.common.context.UserContext;
import com.zhijian.common.result.Result;
import com.zhijian.dto.statistics.DashboardDataVO;
import com.zhijian.service.OrderService;
import com.zhijian.statistics.dto.DashboardDataDTO;
import com.zhijian.statistics.service.StatisticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "数据统计")
@RestController
@RequestMapping("/statistics")
@RequiredArgsConstructor
public class StatisticsController {

    private final StatisticsService statisticsService;
    private final OrderService orderService;

    @Operation(summary = "获取管理端仪表盘数据 (旧)")
    @GetMapping("/dashboard")
    public Result<DashboardDataDTO> getDashboard() {
        String role = UserContext.getRole();
        if (!"ADMIN".equals(role)) {
            return Result.failed("无权访问");
        }
        return Result.success(statisticsService.getAdminDashboardData());
    }

    @Operation(summary = "获取平台管理端统计数据")
    @GetMapping("/admin/dashboard")
    public Result<DashboardDataVO> getAdminDashboard() {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        if (!"ADMIN".equals(UserContext.getRole())) {
            return Result.failed("无权操作");
        }
        return Result.success(orderService.getAdminStatistics());
    }

    @Operation(summary = "获取商家端统计数据")
    @GetMapping("/merchant/dashboard")
    public Result<DashboardDataVO> getMerchantDashboard() {
        Long sellerId = UserContext.getUserId();
        if (sellerId == null) {
            return Result.failed("请先登录");
        }
        if (!"SELLER".equals(UserContext.getRole())) {
            return Result.failed("无权操作");
        }
        return Result.success(orderService.getMerchantStatistics(sellerId));
    }
}
