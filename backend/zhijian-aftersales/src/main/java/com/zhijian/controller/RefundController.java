package com.zhijian.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.zhijian.service.RefundService;
import com.zhijian.common.context.UserContext;
import com.zhijian.common.result.Result;
import com.zhijian.pojo.aftersales.entity.RefundApply;
import com.zhijian.dto.aftersales.RefundApplyDTO;
import com.zhijian.dto.aftersales.RefundAuditDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 售后管理控制器
 * 处理退款申请、审核等售后相关接口
 */
@Tag(name = "售后管理", description = "处理退款申请、审核及相关查询功能")
@RestController
@RequestMapping("/aftersales")
@RequiredArgsConstructor
public class RefundController {

    private final RefundService refundService; // 退款服务

    /**
     * 提交退款申请
     * 普通用户可调用此接口为符合条件的订单申请退款
     *
     * @param applyDTO 退款申请参数
     * @return 操作结果
     */
    @Operation(summary = "申请退款", description = "用户为指定订单提交退款申请")
    @PostMapping("/apply")
    public Result apply(@RequestBody @Valid RefundApplyDTO applyDTO) {
        // 调用服务层处理退款申请，返回布尔结果转换为统一响应格式
        return refundService.applyRefund(applyDTO) ? Result.success() : Result.failed();
    }

    /**
     * 审核退款申请
     * 仅管理员或商家角色可调用此接口审核退款申请
     *
     * @param auditDTO 退款审核参数
     * @return 操作结果
     */
    @Operation(summary = "审核退款", description = "管理员或商家审核退款申请，支持通过/拒绝")
    @PostMapping("/audit")
    public Result audit(@RequestBody @Valid RefundAuditDTO auditDTO) {
        // 权限校验：仅管理员(ADMIN)或商家(SELLER)角色可操作
        String role = UserContext.getRole();
        if (!"ADMIN".equals(role) && !"SELLER".equals(role)) {
            return Result.failed("无权操作");
        }

        // 调用服务层处理审核逻辑
        return refundService.auditRefund(auditDTO) ? Result.success() : Result.failed();
    }

    /**
     * 查询我的售后申请列表
     * 用户查看自己提交的所有退款申请记录
     *
     * @param page 当前页码，默认第1页
     * @param size 每页条数，默认10条
     * @return 分页的退款申请列表
     */
    @Operation(summary = "我的售后申请", description = "查询当前用户提交的所有退款申请记录")
    @GetMapping("/my")
    public Result<IPage<RefundApply>> myRefunds(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {
        // 获取当前用户ID
        Long userId = UserContext.getUserId();

        // 构建分页参数
        Page<RefundApply> pageParam = new Page<>(page, size);

        // 构建查询条件：查询当前用户的申请，按创建时间倒序排列
        LambdaQueryWrapper<RefundApply> queryWrapper = new LambdaQueryWrapper<RefundApply>()
                .eq(RefundApply::getUserId, userId)
                .orderByDesc(RefundApply::getCreateTime);

        // 执行分页查询并返回结果
        return Result.success(refundService.page(pageParam, queryWrapper));
    }

    /**
     * 查询售后申请列表（管理端）
     * 仅管理员或商家角色可调用，可查看所有用户的退款申请
     *
     * @param page   当前页码，默认第1页
     * @param size   每页条数，默认10条
     * @param status 退款状态筛选条件（可选）
     * @return 分页的退款申请列表（包含订单和用户详情）
     */
    @Operation(summary = "售后申请列表", description = "管理员或商家查看所有用户的退款申请，支持按状态筛选")
    @GetMapping("/list")
    public Result<IPage<RefundApply>> list(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) Integer status) {
        // 权限校验：仅管理员(ADMIN)或商家(SELLER)角色可访问
        String role = UserContext.getRole();
        if (!"ADMIN".equals(role) && !"SELLER".equals(role)) {
            return Result.failed("无权操作");
        }

        // 构建分页参数
        Page<RefundApply> pageParam = new Page<>(page, size);

        // 调用服务层方法，返回带详细信息的列表
        return Result.success(refundService.pageWithDetail(pageParam, status));
    }
}
