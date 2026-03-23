package com.zhijian.marketing.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.zhijian.common.result.Result;
import com.zhijian.marketing.dto.UserCouponDTO;
import com.zhijian.marketing.pojo.UserCoupon;

import java.math.BigDecimal;
import java.util.List;

/**
 * 用户优惠券服务接口。
 */
public interface UserCouponService extends IService<UserCoupon> {

    /**
     * 领取优惠券。
     *
     * @param couponId 优惠券 ID
     * @param userId 用户 ID
     * @return 领取结果
     */
    Result receive(Long couponId, Long userId);

    /**
     * 查询我的优惠券列表。
     *
     * @param userId 用户 ID
     * @param status 使用状态
     * @return 用户优惠券列表
     */
    List<UserCouponDTO> myCoupons(Long userId, Integer status);

    /**
     * 核销优惠券。
     *
     * @param userCouponId 用户优惠券记录 ID
     * @param orderId 订单 ID
     */
    void useCoupon(Long userCouponId, Long orderId);

    /**
     * 计算优惠券可抵扣金额。
     *
     * @param userCouponId 用户优惠券记录 ID
     * @param orderAmount 订单金额
     * @return 可抵扣金额
     */
    BigDecimal getCouponAmount(Long userCouponId, BigDecimal orderAmount);
}
