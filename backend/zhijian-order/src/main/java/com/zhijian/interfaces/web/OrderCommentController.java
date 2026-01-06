package com.zhijian.interfaces.web;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.zhijian.application.service.OrderCommentService;
import com.zhijian.common.context.UserContext;
import com.zhijian.common.result.Result;
import com.zhijian.domain.order.entity.OrderComment;
import com.zhijian.interfaces.dto.order.OrderCommentCreateDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

/**
 * 订单评价控制器
 * 
 * @author Liuhaonan
 * @since 1.0.0
 */
@Tag(name = "订单评价管理")
@RestController
@RequestMapping("/api/comments")
public class OrderCommentController {

    @Resource
    private OrderCommentService orderCommentService;

    /**
     * 发表评价
     *
     * @param createDTO 评价创建参数
     * @return 结果
     */
    @Operation(summary = "发表评价")
    @PostMapping("/add")
    public Result add(@Valid @RequestBody OrderCommentCreateDTO createDTO) {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        return orderCommentService.comment(createDTO, userId);
    }

    /**
     * 获取药品评价列表
     *
     * @param medicineId 药品ID
     * @param page       页码
     * @param size       每页大小
     * @return 评价分页列表
     */
    @Operation(summary = "获取药品评价列表")
    @GetMapping("/medicine/{medicineId}")
    public Result<IPage<OrderComment>> getMedicineComments(@PathVariable Long medicineId,
                                                           @RequestParam(defaultValue = "1") Integer page,
                                                           @RequestParam(defaultValue = "10") Integer size) {
        return Result.success(orderCommentService.getMedicineComments(medicineId, page, size));
    }

    /**
     * 获取我的评价列表
     *
     * @param page 页码
     * @param size 每页大小
     * @return 评价分页列表
     */
    @Operation(summary = "获取我的评价列表")
    @GetMapping("/my")
    public Result<IPage<OrderComment>> getMyComments(@RequestParam(defaultValue = "1") Integer page,
                                                     @RequestParam(defaultValue = "10") Integer size) {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        return Result.success(orderCommentService.getMyComments(userId, page, size));
    }
}
