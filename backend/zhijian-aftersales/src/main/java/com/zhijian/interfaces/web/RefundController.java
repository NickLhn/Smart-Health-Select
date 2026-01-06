package com.zhijian.interfaces.web;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.zhijian.interfaces.dto.aftersales.RefundApplyDTO;
import com.zhijian.interfaces.dto.aftersales.RefundAuditDTO;
import com.zhijian.domain.aftersales.entity.RefundApply;
import com.zhijian.application.service.RefundService;
import com.zhijian.common.result.Result;
import com.zhijian.common.context.UserContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@Tag(name = "售后管理")
@RestController
@RequestMapping("/aftersales")
@RequiredArgsConstructor
public class RefundController {

    private final RefundService refundService;

    @Operation(summary = "申请退款")
    @PostMapping("/apply")
    public Result apply(@RequestBody @Valid RefundApplyDTO applyDTO) {
        return refundService.applyRefund(applyDTO) ? Result.success() : Result.failed();
    }

    @Operation(summary = "审核退款 (管理员/商家)")
    @PostMapping("/audit")
    public Result audit(@RequestBody @Valid RefundAuditDTO auditDTO) {
        // 简单权限校验
        String role = UserContext.getRole();
        if (!"ADMIN".equals(role) && !"SELLER".equals(role)) {
            return Result.failed("无权操作");
        }
        return refundService.auditRefund(auditDTO) ? Result.success() : Result.failed();
    }

    @Operation(summary = "我的售后申请")
    @GetMapping("/my")
    public Result<IPage<RefundApply>> myRefunds(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {
        Long userId = UserContext.getUserId();
        Page<RefundApply> pageParam = new Page<>(page, size);
        return Result.success(refundService.page(pageParam, 
                new LambdaQueryWrapper<RefundApply>()
                        .eq(RefundApply::getUserId, userId)
                        .orderByDesc(RefundApply::getCreateTime)));
    }
    
    @Operation(summary = "售后申请列表 (管理员/商家)")
    @GetMapping("/list")
    public Result<IPage<RefundApply>> list(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) Integer status) {
        String role = UserContext.getRole();
        if (!"ADMIN".equals(role) && !"SELLER".equals(role)) {
            return Result.failed("无权操作");
        }
        Page<RefundApply> pageParam = new Page<>(page, size);
        return Result.success(refundService.pageWithDetail(pageParam, status));
    }
}
