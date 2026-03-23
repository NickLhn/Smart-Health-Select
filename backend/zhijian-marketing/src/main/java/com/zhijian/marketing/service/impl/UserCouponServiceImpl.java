package com.zhijian.marketing.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhijian.common.result.Result;
import com.zhijian.marketing.dto.UserCouponDTO;
import com.zhijian.marketing.mapper.UserCouponMapper;
import com.zhijian.marketing.pojo.Coupon;
import com.zhijian.marketing.pojo.UserCoupon;
import com.zhijian.marketing.service.CouponService;
import com.zhijian.marketing.service.UserCouponService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * 用户优惠券服务实现类。
 */
@Service
@RequiredArgsConstructor
public class UserCouponServiceImpl extends ServiceImpl<UserCouponMapper, UserCoupon> implements UserCouponService {

    /**
     * 优惠券业务服务。
     */
    private final CouponService couponService;

    /**
     * 领取优惠券。
     *
     * @param couponId 优惠券 ID
     * @param userId 用户 ID
     * @return 领取结果
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result receive(Long couponId, Long userId) {
        // 领取前校验优惠券是否存在、是否失效以及是否还有库存。
        Coupon coupon = couponService.getById(couponId);
        if (coupon == null) {
            return Result.failed("优惠券不存在");
        }
        if (coupon.getStatus() == 0 || LocalDateTime.now().isAfter(coupon.getEndTime())) {
            return Result.failed("优惠券已失效");
        }
        if (coupon.getReceiveCount() >= coupon.getTotalCount()) {
            return Result.failed("优惠券已领完");
        }

        long count = this.count(new LambdaQueryWrapper<UserCoupon>()
                .eq(UserCoupon::getUserId, userId)
                .eq(UserCoupon::getCouponId, couponId));
        if (count >= coupon.getPerLimit()) {
            return Result.failed("您已领取过该优惠券");
        }

        // 生成用户优惠券记录，并分配一段简短券码。
        UserCoupon userCoupon = new UserCoupon();
        userCoupon.setCouponId(couponId);
        userCoupon.setUserId(userId);
        userCoupon.setCouponCode(UUID.randomUUID().toString().substring(0, 8));
        userCoupon.setGetType(1);
        userCoupon.setUseStatus(0);
        this.save(userCoupon);

        couponService.update().setSql("receive_count = receive_count + 1")
                .eq("id", couponId)
                .update();

        return Result.success();
    }

    /**
     * 查询我的优惠券列表。
     *
     * @param userId 用户 ID
     * @param status 使用状态
     * @return 用户优惠券列表
     */
    @Override
    public List<UserCouponDTO> myCoupons(Long userId, Integer status) {
        // 用户券记录和优惠券主表信息在这里做一次组装返回。
        LambdaQueryWrapper<UserCoupon> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserCoupon::getUserId, userId)
                .eq(status != null, UserCoupon::getUseStatus, status)
                .orderByDesc(UserCoupon::getCreateTime);
        List<UserCoupon> list = this.list(wrapper);

        if (list.isEmpty()) {
            return new ArrayList<>();
        }

        List<UserCouponDTO> result = new ArrayList<>();
        for (UserCoupon uc : list) {
            Coupon coupon = couponService.getById(uc.getCouponId());
            if (coupon != null) {
                UserCouponDTO dto = new UserCouponDTO();
                dto.setId(uc.getId());
                dto.setCouponId(coupon.getId());
                dto.setName(coupon.getName());
                dto.setAmount(coupon.getAmount());
                dto.setMinPoint(coupon.getMinPoint());
                dto.setStartTime(coupon.getStartTime());
                dto.setEndTime(coupon.getEndTime());
                dto.setUseStatus(uc.getUseStatus());
                result.add(dto);
            }
        }
        return result;
    }

    /**
     * 核销优惠券。
     *
     * @param userCouponId 用户优惠券记录 ID
     * @param orderId 订单 ID
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void useCoupon(Long userCouponId, Long orderId) {
        // 核销时要求优惠券必须处于未使用状态。
        UserCoupon userCoupon = this.getById(userCouponId);
        if (userCoupon == null) {
            throw new RuntimeException("优惠券不存在");
        }
        if (userCoupon.getUseStatus() != 0) {
            throw new RuntimeException("优惠券已使用或过期");
        }

        userCoupon.setUseStatus(1);
        userCoupon.setUseTime(LocalDateTime.now());
        userCoupon.setOrderId(orderId);
        this.updateById(userCoupon);

        couponService.update().setSql("use_count = use_count + 1")
                .eq("id", userCoupon.getCouponId())
                .update();
    }

    /**
     * 计算优惠券可抵扣金额。
     *
     * @param userCouponId 用户优惠券记录 ID
     * @param orderAmount 订单金额
     * @return 可抵扣金额
     */
    @Override
    public BigDecimal getCouponAmount(Long userCouponId, BigDecimal orderAmount) {
        // 金额试算阶段只返回抵扣金额，不直接修改用户券状态。
        UserCoupon userCoupon = this.getById(userCouponId);
        if (userCoupon == null) {
            return BigDecimal.ZERO;
        }

        Coupon coupon = couponService.getById(userCoupon.getCouponId());
        if (coupon == null) {
            return BigDecimal.ZERO;
        }

        if (orderAmount.compareTo(coupon.getMinPoint()) < 0) {
            throw new RuntimeException("未满足优惠券使用门槛");
        }

        return coupon.getAmount();
    }
}
