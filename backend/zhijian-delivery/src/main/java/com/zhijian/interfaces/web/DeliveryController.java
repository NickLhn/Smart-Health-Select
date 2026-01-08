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

import java.util.Map;

/**
 * 配送管理控制器 (骑手端)
 * 提供骑手相关的配送操作接口，包括接单、送达确认、异常上报等功能
 *
 * @author Liuhaonan
 * @since 1.0.0
 */
@Tag(name = "配送管理 (骑手端)", description = "骑手配送操作相关接口")
@RestController
@RequestMapping("/delivery")
@RequiredArgsConstructor
public class DeliveryController {

    private final DeliveryService deliveryService;

    /**
     * 查询可接单列表
     * 获取当前待接单的配送任务列表，支持分页查询
     *
     * @param page 页码，默认第1页
     * @param size 每页大小，默认10条
     * @return 待接单配送列表分页数据
     */
    @Operation(summary = "查询可接单列表", description = "获取当前待接单的配送任务列表")
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

    /**
     * 骑手接单
     * 骑手接受指定配送任务
     *
     * @param id 配送单ID
     * @return 操作结果
     */
    @Operation(summary = "骑手接单", description = "骑手接受指定配送任务")
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

    /**
     * 确认送达
     * 骑手确认配送任务已完成
     *
     * @param id 配送单ID
     * @param proofImage 配送证明图片URL（可选）
     * @param verifyCode 签收码（可选）
     * @return 操作结果
     */
    @Operation(summary = "确认送达", description = "骑手确认配送任务已完成")
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

    /**
     * 异常上报
     * 骑手上报配送过程中的异常情况
     *
     * @param id 配送单ID
     * @param reason 异常原因
     * @return 操作结果
     */
    @Operation(summary = "异常上报", description = "骑手上报配送过程中的异常情况")
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

    /**
     * 我的配送单
     * 查询当前骑手的配送任务列表，支持按状态筛选
     *
     * @param status 配送状态筛选（可选）
     * @param page 页码，默认第1页
     * @param size 每页大小，默认10条
     * @return 配送单分页列表
     */
    @Operation(summary = "我的配送单", description = "查询当前骑手的配送任务列表，支持按状态筛选")
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

    /**
     * 获取统计数据
     * 获取当前骑手的配送统计数据（今日/本月/总计订单量和收入）
     *
     * @return 统计数据Map
     */
    @Operation(summary = "获取统计数据", description = "获取当前骑手的配送统计数据")
    @GetMapping("/stats")
    public Result<Map<String, Object>> getStats() {
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