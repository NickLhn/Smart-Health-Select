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

/**
 * 用户优惠券控制器。
 */
@Tag(name = "用户优惠券")
@RestController
@RequestMapping("/marketing/user-coupon")
@RequiredArgsConstructor
public class UserCouponController {

    /**
     * 用户优惠券业务服务。
     */
    private final UserCouponService userCouponService;

    /**
     * 领取优惠券。
     *
     * @param couponId 优惠券 ID
     * @return 领取结果
     */
    @Operation(summary = "领取优惠券")
    @PostMapping("/receive/{couponId}")
    public Result receive(@PathVariable Long couponId) {
        // 领取操作始终绑定当前登录用户。
        Long userId = UserContext.getUserId();
        return userCouponService.receive(couponId, userId);
    }

    /**
     * 查询我的优惠券列表。
     *
     * @param status 使用状态
     * @return 用户优惠券列表
     */
    @Operation(summary = "我的优惠券")
    @GetMapping("/my")
    public Result<List<UserCouponDTO>> myCoupons(@RequestParam(required = false) Integer status) {
        // 我的优惠券只按当前用户查询，不允许前端指定 userId。
        Long userId = UserContext.getUserId();
        return Result.success(userCouponService.myCoupons(userId, status));
    }
}
