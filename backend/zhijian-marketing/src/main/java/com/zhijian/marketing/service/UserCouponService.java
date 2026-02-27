package com.zhijian.marketing.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.zhijian.common.result.Result;
import com.zhijian.marketing.dto.UserCouponDTO;
import com.zhijian.marketing.pojo.UserCoupon;

import java.math.BigDecimal;
import java.util.List;

public interface UserCouponService extends IService<UserCoupon> {
    Result receive(Long couponId, Long userId);

    List<UserCouponDTO> myCoupons(Long userId, Integer status);

    void useCoupon(Long userCouponId, Long orderId);

    BigDecimal getCouponAmount(Long userCouponId, BigDecimal orderAmount);
}
