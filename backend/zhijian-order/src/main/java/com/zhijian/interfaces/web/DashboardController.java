package com.zhijian.interfaces.web;

import com.zhijian.application.service.OrderService;
import com.zhijian.common.context.UserContext;
import com.zhijian.common.result.Result;
import com.zhijian.interfaces.dto.statistics.DashboardDataVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 仪表盘控制器
 */
@Tag(name = "仪表盘管理")
@RestController
@RequestMapping("/dashboard")
public class DashboardController {

    @Resource
    private OrderService orderService;

    /**
     * 获取商家仪表盘数据
     * @return 仪表盘数据
     */
    @Operation(summary = "获取商家仪表盘数据")
    @GetMapping("/seller/stats")
    public Result<DashboardDataVO> getSellerStats() {
        Long sellerId = UserContext.getUserId();
        if (sellerId == null) {
            return Result.failed("请先登录");
        }
        if (!"SELLER".equals(UserContext.getRole())) {
            return Result.failed("无权操作：非商家账号");
        }
        return Result.success(orderService.getMerchantStatistics(sellerId));
    }

    /**
     * 获取管理员仪表盘数据
     * @return 仪表盘数据
     */
    @Operation(summary = "获取管理员仪表盘数据")
    @GetMapping("/admin/stats")
    public Result<DashboardDataVO> getAdminStats() {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        if (!"ADMIN".equals(UserContext.getRole())) {
            return Result.failed("无权操作：非管理员账号");
        }
        return Result.success(orderService.getAdminStatistics());
    }
}
