package com.zhijian.delivery.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.zhijian.common.context.UserContext;
import com.zhijian.common.result.Result;
import com.zhijian.delivery.pojo.Delivery;
import com.zhijian.delivery.service.DeliveryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 配送管理控制器。
 * <p>
 * 提供骑手端的接单、完成配送、异常上报和统计查询能力。
 */
@Tag(name = "配送管理 (骑手端)", description = "骑手配送操作相关接口")
@RestController
@RequestMapping("/delivery")
@RequiredArgsConstructor
public class DeliveryController {

    /**
     * 配送业务服务。
     */
    private final DeliveryService deliveryService;

    /**
     * 查询可接单列表。
     *
     * @param page 页码
     * @param size 每页条数
     * @return 配送单分页结果
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
     * 骑手接单。
     *
     * @param id 配送单 ID
     * @return 接单结果
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
     * 确认送达。
     *
     * @param id 配送单 ID
     * @param proofImage 配送凭证图片
     * @param verifyCode 核销码
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
     * 上报配送异常。
     *
     * @param id 配送单 ID
     * @param reason 异常原因
     * @return 上报结果
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
     * 查询当前骑手的配送单列表。
     *
     * @param status 配送状态
     * @param page 页码
     * @param size 每页条数
     * @return 配送单分页结果
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
     * 获取骑手统计数据。
     *
     * @return 统计数据
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
