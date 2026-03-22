package com.zhijian.marketing.controller;

import com.zhijian.common.context.UserContext;
import com.zhijian.common.result.Result;
import com.zhijian.marketing.dto.UserCouponDTO;
import com.zhijian.marketing.service.UserCouponService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "用户优惠券")
@RestController
@RequestMapping("/marketing/user-coupon")
@RequiredArgsConstructor
public class UserCouponController {

    private final UserCouponService userCouponService;

    // 用户优惠券相关接口：领取、查询我的优惠券。

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
