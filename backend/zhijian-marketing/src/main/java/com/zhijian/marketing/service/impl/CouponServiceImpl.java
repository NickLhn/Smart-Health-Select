package com.zhijian.marketing.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhijian.common.result.Result;
import com.zhijian.marketing.dto.CouponCreateDTO;
import com.zhijian.marketing.mapper.CouponMapper;
import com.zhijian.marketing.pojo.Coupon;
import com.zhijian.marketing.service.CouponService;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class CouponServiceImpl extends ServiceImpl<CouponMapper, Coupon> implements CouponService {

    @Override
    public Result create(CouponCreateDTO createDTO) {
        Coupon coupon = new Coupon();
        BeanUtils.copyProperties(createDTO, coupon);
        coupon.setUseCount(0);
        coupon.setReceiveCount(0);
        coupon.setStatus(1);
        this.save(coupon);
        return Result.success();
    }

    @Override
    public List<Coupon> listAvailable(Long userId) {
        LambdaQueryWrapper<Coupon> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Coupon::getStatus, 1)
                .ge(Coupon::getEndTime, LocalDateTime.now())
                .le(Coupon::getStartTime, LocalDateTime.now())
                .apply("receive_count < total_count");
        return this.list(wrapper);
    }

    @Override
    public IPage<Coupon> pageList(Integer page, Integer size, String name, Integer type, Integer status) {
        Page<Coupon> pageParam = new Page<>(page, size);
        LambdaQueryWrapper<Coupon> wrapper = new LambdaQueryWrapper<>();
        wrapper.like(name != null && !name.isEmpty(), Coupon::getName, name)
                .eq(type != null, Coupon::getType, type)
                .eq(status != null, Coupon::getStatus, status)
                .orderByDesc(Coupon::getCreateTime);
        return this.page(pageParam, wrapper);
    }

    @Override
    public Result update(Long id, CouponCreateDTO createDTO) {
        Coupon coupon = this.getById(id);
        if (coupon == null) {
            return Result.failed("优惠券不存在");
        }
        BeanUtils.copyProperties(createDTO, coupon);
        this.updateById(coupon);
        return Result.success();
    }

    @Override
    public Result delete(Long id) {
        this.removeById(id);
        return Result.success();
    }

    @Override
    public Result updateStatus(Long id, Integer status) {
        Coupon coupon = new Coupon();
        coupon.setId(id);
        coupon.setStatus(status);
        this.updateById(coupon);
        return Result.success();
    }
}
