package com.zhijian.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.zhijian.service.MerchantService;
import com.zhijian.common.context.UserContext;
import com.zhijian.common.result.Result;
import com.zhijian.pojo.user.entity.Merchant;
import com.zhijian.dto.merchant.MerchantApplyDTO;
import com.zhijian.dto.merchant.MerchantAuditDTO;
import com.zhijian.dto.merchant.MerchantQueryDTO;
import com.zhijian.dto.merchant.MerchantSettingDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 商家管理控制器
 *
 * @author TraeAI
 * @since 1.0.0
 */
@Tag(name = "商家管理")
@RestController
@RequestMapping("/merchant")
@RequiredArgsConstructor
public class MerchantController {

    private final MerchantService merchantService;

    @Operation(summary = "商家列表 (管理端)")
    @GetMapping("/list")
    public Result<IPage<Merchant>> list(MerchantQueryDTO query) {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        if (!UserContext.isAdmin()) {
            return Result.failed("无权访问");
        }
        return Result.success(merchantService.pageList(query));
    }

    @Operation(summary = "获取我的店铺信息")
    @GetMapping("/my-store")
    public Result<Merchant> getMyStore() {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        Merchant merchant = merchantService.getByUserId(userId);
        return Result.success(merchant);
    }

    @Operation(summary = "商家入驻/更新信息")
    @PostMapping("/apply")
    public Result apply(@RequestBody @Valid MerchantApplyDTO applyDTO) {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        return merchantService.apply(userId, applyDTO);
    }

    @Operation(summary = "获取商家详情 (管理端)")
    @GetMapping("/{id}")
    public Result<Merchant> getDetail(@PathVariable Long id) {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        if (!UserContext.isAdmin()) {
            return Result.failed("无权访问");
        }
        return Result.success(merchantService.getById(id));
    }
    
    @Operation(summary = "获取商家详情 By UserId (管理端)")
    @GetMapping("/user/{userId}")
    public Result<Merchant> getDetailByUserId(@PathVariable Long userId) {
        return Result.success(merchantService.getByUserId(userId));
    }

    @Operation(summary = "商家审核 (管理端)")
    @PutMapping("/audit")
    public Result audit(@RequestBody @Valid MerchantAuditDTO auditDTO) {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        if (!UserContext.isAdmin()) {
            return Result.failed("无权访问");
        }
        return merchantService.audit(auditDTO);
    }

    @Operation(summary = "更新商家运营设置")
    @PutMapping("/settings")
    public Result updateSettings(@RequestBody MerchantSettingDTO settingDTO) {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return Result.failed("请先登录");
        }
        return merchantService.updateSettings(userId, settingDTO);
    }
}

