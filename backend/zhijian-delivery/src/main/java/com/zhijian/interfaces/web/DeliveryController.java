package com.zhijian.interfaces.web;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.zhijian.common.context.UserContext;
import com.zhijian.common.result.Result;
import com.zhijian.domain.delivery.entity.Delivery;
import com.zhijian.application.service.DeliveryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 配送管理控制器 (骑手端)
 *
 * @author Liuhaonan
 * @since 1.0.0
 */
@Tag(name = "配送管理 (骑手端)")
@RestController
@RequestMapping("/delivery")
@RequiredArgsConstructor
public class DeliveryController {

    private final DeliveryService deliveryService;

    @Operation(summary = "查询可接单列表")
    @GetMapping("/pending/list")
    public Result<IPage<Delivery>> listPending(@RequestParam(defaultValue = "1") int page,
                                               @RequestParam(defaultValue = "10") int size) {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        if (!"RIDER".equals(UserContext.getRole())) {
            return Result.failed("只有骑手可以查看");
        }
        return Result.success(deliveryService.listPendingDeliveries(page, size));
    }

    @Operation(summary = "骑手接单")
    @PostMapping("/{id}/accept")
    public Result accept(@PathVariable Long id) {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        if (!"RIDER".equals(UserContext.getRole())) {
            return Result.failed("只有骑手可以接单");
        }
        boolean success = deliveryService.acceptDelivery(id, userId);
        return success ? Result.success(null, "接单成功") : Result.failed("接单失败");
    }

    @Operation(summary = "确认送达")
    @PostMapping("/{id}/complete")
    public Result complete(@PathVariable Long id, 
                           @RequestParam(required = false) String proofImage,
                           @RequestParam(required = false) String verifyCode) {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        if (!"RIDER".equals(UserContext.getRole())) {
            return Result.failed("只有骑手可以操作");
        }
        boolean success = deliveryService.completeDelivery(id, userId, proofImage, verifyCode);
        return success ? Result.success(null, "操作成功") : Result.failed("操作失败");
    }

    @Operation(summary = "异常上报")
    @PostMapping("/{id}/exception")
    public Result reportException(@PathVariable Long id, @RequestParam String reason) {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        if (!"RIDER".equals(UserContext.getRole())) {
            return Result.failed("只有骑手可以操作");
        }
        boolean success = deliveryService.reportException(id, userId, reason);
        return success ? Result.success(null, "上报成功") : Result.failed("上报失败");
    }

    @Operation(summary = "我的配送单")
    @GetMapping("/my/list")
    public Result<IPage<Delivery>> listMy(@RequestParam(required = false) Integer status,
                                          @RequestParam(defaultValue = "1") int page,
                                          @RequestParam(defaultValue = "10") int size) {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        if (!"RIDER".equals(UserContext.getRole())) {
            return Result.failed("只有骑手可以查看");
        }
        return Result.success(deliveryService.listMyDeliveries(userId, status, page, size));
    }

    @Operation(summary = "获取统计数据")
    @GetMapping("/stats")
    public Result<java.util.Map<String, Object>> getStats() {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        if (!"RIDER".equals(UserContext.getRole())) {
            return Result.failed("只有骑手可以查看");
        }
        return Result.success(deliveryService.getRiderStats(userId));
    }
}
