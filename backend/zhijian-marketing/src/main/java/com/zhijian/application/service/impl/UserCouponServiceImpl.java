package com.zhijian.application.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhijian.application.service.CouponService;
import com.zhijian.application.service.UserCouponService;
import com.zhijian.common.result.Result;
import com.zhijian.domain.marketing.entity.Coupon;
import com.zhijian.domain.marketing.entity.UserCoupon;
import com.zhijian.infrastructure.persistence.mapper.UserCouponMapper;
import com.zhijian.interfaces.dto.UserCouponDTO;
import jakarta.annotation.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * 用户优惠券服务实现类
 *
 * @author Liuhaonan
 * @since 1.0.0
 */
@Service
public class UserCouponServiceImpl extends ServiceImpl<UserCouponMapper, UserCoupon> implements UserCouponService {

    @Resource
    private CouponService couponService;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result receive(Long couponId, Long userId) {
        // 1. 校验优惠券
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

        // 2. 校验领取限制
        long count = this.count(new LambdaQueryWrapper<UserCoupon>()
                .eq(UserCoupon::getUserId, userId)
                .eq(UserCoupon::getCouponId, couponId));
        if (count >= coupon.getPerLimit()) {
            return Result.failed("您已领取过该优惠券");
        }

        // 3. 发放优惠券
        UserCoupon userCoupon = new UserCoupon();
        userCoupon.setCouponId(couponId);
        userCoupon.setUserId(userId);
        userCoupon.setCouponCode(UUID.randomUUID().toString().substring(0, 8));
        userCoupon.setGetType(1); // 主动领取
        userCoupon.setUseStatus(0); // 未使用
        this.save(userCoupon);

        // 4. 更新统计
        couponService.update().setSql("receive_count = receive_count + 1")
                .eq("id", couponId)
                .update();

        return Result.success();
    }

    @Override
    public List<UserCouponDTO> myCoupons(Long userId, Integer status) {
        // 1. 查询用户优惠券
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

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void useCoupon(Long couponId, Long orderId) {
        // 校验并更新状态
        UserCoupon userCoupon = this.getById(couponId); // 注意：这里传入的是 UserCoupon 的 ID，还是 Coupon ID？
        // 这里的逻辑需要确认：前端传的是 UserCoupon.id (领取记录ID) 还是 Coupon.id (模板ID)？
        // 通常下单时选择的是 "我的优惠券"，所以应该是 UserCoupon.id。
        
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
        
        // 更新模板统计
        couponService.update().setSql("use_count = use_count + 1")
                .eq("id", userCoupon.getCouponId())
                .update();
    }

    @Override
    public BigDecimal getCouponAmount(Long userCouponId, BigDecimal orderAmount) {
        UserCoupon userCoupon = this.getById(userCouponId);
        if (userCoupon == null) return BigDecimal.ZERO;
        
        Coupon coupon = couponService.getById(userCoupon.getCouponId());
        if (coupon == null) return BigDecimal.ZERO;
        
        if (orderAmount.compareTo(coupon.getMinPoint()) < 0) {
            throw new RuntimeException("未满足优惠券使用门槛");
        }
        
        return coupon.getAmount();
    }
}
