package com.zhijian.controller;

import com.zhijian.service.UserCouponService;
import com.zhijian.common.context.UserContext;
import com.zhijian.common.result.Result;
import com.zhijian.dto.UserCouponDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 用户优惠券控制器
 *
 * @author Liuhaonan
 * @since 1.0.0
 */
@Tag(name = "用户优惠券")
@RestController
@RequestMapping("/marketing/user-coupon")
public class UserCouponController {

    @Resource
    private UserCouponService userCouponService;

    @Operation(summary = "领取优惠券")
    @PostMapping("/receive/{couponId}")
    public Result receive(@PathVariable Long couponId) {
        Long userId = UserContext.getUserId();
        return userCouponService.receive(couponId, userId);
    }

    @Operation(summary = "我的优惠券")
    @GetMapping("/my")
    public Result<List<UserCouponDTO>> myCoupons(@RequestParam(required = false) Integer status) {
        Long userId = UserContext.getUserId();
        return Result.success(userCouponService.myCoupons(userId, status));
    }
}

