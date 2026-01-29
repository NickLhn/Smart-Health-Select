package com.zhijian.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.zhijian.common.result.Result;
import com.zhijian.pojo.marketing.entity.UserCoupon;
import com.zhijian.dto.UserCouponDTO;

import java.math.BigDecimal;
import java.util.List;

/**
 * 用户优惠券服务接口
 *
 * @author Liuhaonan
 * @since 1.0.0
 */
public interface UserCouponService extends IService<UserCoupon> {

    /**
     * 领取优惠券
     */
    Result receive(Long couponId, Long userId);

    /**
     * 获取我的优惠券列表
     */
    List<UserCouponDTO> myCoupons(Long userId, Integer status);
    
    /**
     * 核销优惠券 (下单时调用)
     */
    void useCoupon(Long couponId, Long orderId);

    /**
     * 获取优惠券金额 (用于计算)
     */
    BigDecimal getCouponAmount(Long couponId, BigDecimal orderAmount);
}

